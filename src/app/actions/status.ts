'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function logWeeklyStatus(
  clientId: string,
  status: string,
  comment: string,
  weekDate: string
) {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('weekly_status_logs').upsert({
    client_id: clientId,
    status,
    week_date: weekDate,
    comment: comment || null,
  }, {
    onConflict: 'client_id, week_date',
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/')
}

export async function deleteStatus(id: string, clientId: string) {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('weekly_status_logs').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/')
}
