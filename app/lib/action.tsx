'use server';

import { z } from 'zod';
import { db } from '../../firebaseConfig';
import { addDoc, collection, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

export type State = {
    errors?: {
        customerId?: string[],
        amount?: string[],
        status?: string[],
    };
    message?: string | null;
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })

//  Object.fromEntries(formData.entries());

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse(
        {
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        }
    )

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try {
        await addDoc(collection(db, 'invoices'), { customer_id: customerId, amount: amountInCents, status, date })

    } catch (error) {
        console.error('Error adding document: ', error);
    }


    //used to revalidate the catched data in this router segment  so it may refatch the data
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function updateInvoice(  id: string,
    prevState: State,
    formData: FormData,) {
    const validatedFields = UpdateInvoice.safeParse(
        {
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        }
    )

    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        const docRef = doc(db, 'invoices', id)
        await updateDoc(docRef, { customer_id: customerId, amount: amountInCents, status })
    } catch (error) {
        console.error('Error updating document: ', error);
    }



    //used to revalidate the catched data in this router segment  so it may refatch the data
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        const docRef = doc(db, 'invoices', id)
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting document: ', error);
    }

    revalidatePath('/dashboard/invoices');

}