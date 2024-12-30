import { formatCurrency } from './utils';
import { collection, getDoc, getDocs, orderBy, query, limit, doc, where } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

export async function fetchRevenue() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const quearySnapshoot = await getDocs(collection(db, 'revenue'))
    const revData = quearySnapshoot.docs.map((doc) => {
      return (
        { ...doc.data(), id: doc.id }
      )
    })
    return revData;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const q = query(collection(db, 'invoices'), orderBy('date', 'desc'), limit(5))
    const querySnapshot = await getDocs(q);

    const latestInvoices = await Promise.all(
      querySnapshot.docs.map(async (docm) => {
        const customerRef =  doc(db, 'customers', docm.data().customer_id)
        const customersSnap = await getDoc(customerRef)
        const custmerData = customersSnap.data()
        return (
          { ...docm.data(), id: docm.id, email: custmerData.email, image_url: custmerData.image_url }
        )
      })
    );

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {


    const customerCountPromise = await getDocs(collection(db, 'customers'));

    const invoiceCountPromise = await getDocs(collection(db, 'invoices'));

    const [invoiceSnapshot, customerSnapshot] = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
    ]);

    const numberOfCustomers = customerSnapshot.size;
    const numberOfInvoices = invoiceSnapshot.size

    let totalPaidInvoices = 0;
    let totalPendingInvoices = 0;

    invoiceSnapshot.forEach((doc) => {
      const invoice = doc.data();

      if (invoice.status === 'paid') {
        totalPaidInvoices += invoice.amount;
      }
      else {
        totalPendingInvoices += invoice.amount;
      }
    })


    console.log(numberOfCustomers, numberOfInvoices, totalPaidInvoices, totalPendingInvoices)
    return ({
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices: formatCurrency(totalPaidInvoices),
      totalPendingInvoices: formatCurrency(totalPendingInvoices),
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
let results = [];
export async function fetchFilteredInvoices(
  queryText,
  currentPage
) {
  const lowerCaseQuery = queryText.toLowerCase();
  const invoicesRef = collection(db, "invoices");
  const customersRef = collection(db, "customers");
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const customerQueries = [
      query(customersRef, where("name", ">=", lowerCaseQuery), where("name", "<=", lowerCaseQuery + "\uf8ff")),
      query(customersRef, where("email", ">=", lowerCaseQuery), where("email", "<=", lowerCaseQuery + "\uf8ff")),
    ];

    const customers = [];
    let foundCustomer = false;
    for (const q of customerQueries) {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          customers.push({ ...doc.data(), id: doc.id });
        });
        foundCustomer = true;
        break;
      }

    }

    if (!foundCustomer) {
      const querySnapshot = await getDocs(customersRef);
      querySnapshot.forEach((doc) => {
        customers.push({ ...doc.data(), id: doc.id });
      });
    }

    const customerIds = customers.map((customer) => customer.id);

    const invoiceQueries = [
      query(invoicesRef, where("amount", "==", parseFloat(lowerCaseQuery))),
      query(invoicesRef, where("date", "==", lowerCaseQuery)),
      query(invoicesRef, where("status", "==", lowerCaseQuery)),

    ];
    const invoices = [];
    let foundInvoice = false;

    for (const q of invoiceQueries) {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        invoices.push({ ...doc.data(), id: doc.id })
      })
      foundInvoice = true;
      break
    }
  }
  if(!foundInvoice){
    const querySnapshot = await getDocs(invoicesRef)
    querySnapshot.forEach((doc) => {
      invoices.push({ ...doc.data(), id: doc.id })
    })
  }

  console.log(invoices , 'invoices')
    const filteredInvoices = invoices.filter((invoice) => customerIds.includes(invoice.customer_id));
    if (foundCustomer || foundInvoice) {
    results = filteredInvoices.map((invoice) => {
      const customer = customers.find((customer) => customer.id === invoice.customer_id)

      return {
        ...invoice,
        email: customer?.email,
        image_url: customer?.image_url,
        name: customer?.name
      }
    })
  } else {
   results=[];
  }

    const start = offset;
    const end = offset + ITEMS_PER_PAGE;
    return results.slice(start, end).sort((a, b) => b.date - a.date);
    
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages() {
  try {
    const totalPages = Math.ceil(Number(results.length) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id) {
  try {
    const docRef = doc(db, 'invoices', id)
    const querySnapshot = await getDoc(docRef);
    const invoice = {
      ...querySnapshot.data(),
      id: querySnapshot.id,
      amount: querySnapshot.data().amount / 100
    }
    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}



export async function fetchCustomers() {
  try {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'))
    const querySnapshot = await getDocs(q)
    const customers = querySnapshot.docs.map((doc) => (
      { name:doc.data().name, id: doc.id }
    ))
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

// export async function fetchFilteredCustomers(query: string) {
//   try {
//     const data = await sql<CustomersTableType>`
// 		SELECT
// 		  customers.id,
// 		  customers.name,
// 		  customers.email,
// 		  customers.image_url,
// 		  COUNT(invoices.id) AS total_invoices,
// 		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
// 		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
// 		FROM customers
// 		LEFT JOIN invoices ON customers.id = invoices.customer_id
// 		WHERE
// 		  customers.name ILIKE ${`%${query}%`} OR
//         customers.email ILIKE ${`%${query}%`}
// 		GROUP BY customers.id, customers.name, customers.email, customers.image_url
// 		ORDER BY customers.name ASC
// 	  `;

//     const customers = data.rows.map((customer) => ({
//       ...customer,
//       total_pending: formatCurrency(customer.total_pending),
//       total_paid: formatCurrency(customer.total_paid),
//     }));

//     return customers;
//   } catch (err) {
//     console.error('Database Error:', err);
//     throw new Error('Failed to fetch customer table.');
//   }
// }