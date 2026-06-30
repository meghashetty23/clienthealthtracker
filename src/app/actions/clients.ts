'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { buildClientDetails, parseClientMeta } from '@/lib/types'

export async function createClient(formData: FormData) {
  const supabase = await createServerSupabase()

  const accountSize = formData.get('account_size')
  const industry = formData.get('industry')
  const priority = formData.get('priority')
  const notes = formData.get('details')

  const details = buildClientDetails({
    account_size: accountSize ? Number(accountSize) : undefined,
    industry: (industry as string) || undefined,
    priority: (priority as 'High' | 'Medium' | 'Low') || undefined,
    notes: (notes as string) || undefined,
  }, null)

  const { error } = await supabase.from('clients').insert({
    name: formData.get('name') as string,
    account_manager: formData.get('account_manager') as string,
    package: formData.get('package') as string,
    contract_start_date: formData.get('contract_start_date') as string,
    contract_length: formData.get('contract_length') as string,
    details,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createServerSupabase()

  const { data: existing } = await supabase.from('clients').select('details').eq('id', id).single()
  const existingDetails = existing ? (existing as any).details : null

  const accountSize = formData.get('account_size')
  const industry = formData.get('industry')
  const priority = formData.get('priority')
  const notes = formData.get('details')

  const details = buildClientDetails({
    account_size: accountSize ? Number(accountSize) : undefined,
    industry: (industry as string) || undefined,
    priority: (priority as 'High' | 'Medium' | 'Low') || undefined,
    notes: (notes as string) || undefined,
  }, existingDetails)

  const { error } = await supabase.from('clients').update({
    name: formData.get('name'),
    account_manager: formData.get('account_manager'),
    package: formData.get('package'),
    contract_start_date: formData.get('contract_start_date'),
    contract_length: formData.get('contract_length'),
    details,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath(`/clients/${id}`)
}

export async function deleteClient(id: string) {
  const supabase = await createServerSupabase()

  const { error: settingsError } = await supabase
    .from('settings')
    .delete()
    .eq('key', `client_lost:${id}`)

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/clients')
  redirect('/clients')
}
