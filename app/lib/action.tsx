'use server';

import { z } from 'zod';
import { db} from '../../firebaseConfig';
import { addDoc , collection, updateDoc , doc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object ({
    id:z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending' , 'paid']),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true , date:true})

//  Object.fromEntries(formData.entries());
export async function createInvoice (formData:FormData) {
    const { customerId, amount , status} =CreateInvoice.parse(
    {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    }
)
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try {
        await addDoc(collection(db ,'invoices') , {customer_id:customerId , amount:amountInCents , status , date})

    } catch (error) {
        console.error('Error adding document: ', error);
    }


   //used to revalidate the catched data in this router segment  so it may refatch the data
    revalidatePath('/dashboard/invoices'); 
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true , date:true})

export async function updateInvoice (id:string ,formData:FormData) {
    const { customerId, amount , status} =UpdateInvoice.parse(
    {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    }
)
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        const docRef= doc(db , 'invoices' , id)
        await updateDoc(docRef , {customer_id:customerId , amount:amountInCents , status , date})
    }catch (error) {
        console.error('Error updating document: ', error);
    }
  


   //used to revalidate the catched data in this router segment  so it may refatch the data
    revalidatePath('/dashboard/invoices'); 
    redirect('/dashboard/invoices');
}

export async function deleteInvoice (id:string ) {
    throw new Error('Failed to Delete Invoice');
    try {
        const docRef= doc(db , 'invoices' , id)
        await deleteDoc(docRef );
    }catch (error){
        console.error('Error deleting document: ', error);
    }
 
    revalidatePath('/dashboard/invoices'); 
   
}