import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers , fetchInvoiceById } from '@/app/lib/data.jsx';
import { notFound } from 'next/navigation';
 
export default async function Page(props: {params:Promise<{id:string}> }) {
 const params = await props.params;
 const id = params.id;
const [invoice , customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers()
])

if(!invoice) {
    notFound()
}

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Create Invoice',
            href: '/dashboard/invoices/create',
            active: true,
          },
        ]}
      />
      <Form customers={customers} invoice={invoice}/>
    </main>
  );
}