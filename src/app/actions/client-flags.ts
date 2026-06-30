'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function markClientLost(clientId: string, reason: string, lostDate?: string) {
  const supabase = await createServerSupabase()

  const lostAt = lostDate
    ? new Date(lostDate + 'T00:00:00').toISOString()
    : new Date().toISOString()

  const { data: existing } = await supabase
    .from('settings')
    .select('*')
    .eq('key', `client_lost:${clientId}`)
    .maybeSingle()

  const value = JSON.stringify({
    reason,
    lost_at: lostAt,
    reactivated_at: null,
  })

  if (existing) {
    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', `client_lost:${clientId}`)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('settings')
      .insert({ key: `client_lost:${clientId}`, value })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath(`/clients/${clientId}`)
}

export async function reactivateClient(clientId: string) {
  const supabase = await createServerSupabase()

  const value = JSON.stringify({
    reason: '',
    lost_at: null,
    reactivated_at: new Date().toISOString(),
  })

  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('key', `client_lost:${clientId}`)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath(`/clients/${clientId}`)
}

export async function getLostInfo(clientId: string) {
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('key', `client_lost:${clientId}`)
    .maybeSingle()

  if (!data) return null

  return JSON.parse(data.value) as {
    reason: string
    lost_at: string | null
    reactivated_at: string | null
  }
}
