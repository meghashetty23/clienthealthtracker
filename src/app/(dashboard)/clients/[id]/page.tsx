import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { ClientDetail } from './client-detail'
import { parseClientMeta } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: statusLogs } = await supabase
    .from('weekly_status_logs')
    .select('*')
    .eq('client_id', id)
    .order('week_date', { ascending: false })

  const { data: lostSetting } = await supabase
    .from('settings')
    .select('*')
    .eq('key', `client_lost:${id}`)
    .maybeSingle()

  const lostInfo = lostSetting ? JSON.parse(lostSetting.value) : null

  const meta = parseClientMeta((client as any).details)

  return (
    <ClientDetail
      client={client}
      statusLogs={statusLogs || []}
      lostInfo={lostInfo}
      meta={meta}
    />
  )
}
