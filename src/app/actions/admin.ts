'use server'

import { createServerSupabase, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createUser(name: string, email: string, password: string, role: string) {
  const adminSupabase = await createAdminClient()

  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) throw new Error(authError.message)

  const supabase = await createServerSupabase()
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authUser.user.id,
    name,
    role,
  })

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(authUser.user.id)
    throw new Error(profileError.message)
  }

  revalidatePath('/admin')
}

export async function updateUser(id: string, name: string, role: string) {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('profiles').update({ name, role }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function deleteUser(id: string) {
  const adminSupabase = await createAdminClient()
  await adminSupabase.auth.admin.deleteUser(id)

  revalidatePath('/admin')
}

export async function updateSetting(key: string, value: string) {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('settings').upsert({
    key,
    value,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
