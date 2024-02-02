'use server';

import {z} from 'zod';
import {sql} from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'

const formSchema = z.object({
  id: z.string(),
  customerId: z.string({
    required_error:"Name filed id required",
  }),
  amount:z.coerce.number({
    required_error:"You must fill amount field"
  }),
  status:z.enum(['paid','pending'],{
    required_error:"Kindly update the status"
  }),
  date:z.string(),
})

const CreateInvoice = formSchema.omit({id:true,date:true});
const UpdateInvoice = formSchema.omit({id:true, date:true});

export async function createInvoice(formData:FormData){
    const rawFormData = Object.fromEntries(formData.entries());
    const {customerId,amount,status} = CreateInvoice.parse(rawFormData);
    const amountInCents = amount *100;
    const date = new Date().toISOString().split("T")[0];

    try {
      await sql`
      INSERT INTO invoices (customer_id,amount,status, date)
      VALUES (${customerId},${amountInCents}, ${status},${date})`;
    } catch (error) {
      return {message:'Database Error: Failed to Create Invoice.',}
    }
   
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function updateInvoice(id:string, formData:FormData){
  const rawFormData = Object.fromEntries(formData.entries());
  const {customerId,amount,status} = UpdateInvoice.parse(rawFormData);
  const amountInCents = amount *100;

  try {
    await sql `
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}`
  } catch (error) {
    return {message:'Database Error: Failed to Create Invoice.',}
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id:string){
  // throw new Error('Failed  to delete invoice');
  try {
    await sql `
    DELETE FROM invoices WHERE id=${id}`;
    revalidatePath('/dashboard/invoices');
    return{message:"Invoice deleted successfully"}
  } catch (error) {
    return {message:'Database Error: Failed to Create Invoice.',}
  }
  
}