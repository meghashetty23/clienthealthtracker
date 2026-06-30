import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { AMPanel } from './am-panel'
import { parseClientMeta } from '@/lib/types'

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}

interface PageProps {
  params: Promise<{ name: string }>
}

export default async function AMPage({ params }: PageProps) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const supabase = await createServerSupabase()
  const thisWeekMonday = getMonday(new Date())

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('account_manager', decodedName)
    .order('name')

  if (!clients || clients.length === 0) notFound()

  const clientIds = clients.map((c: any) => c.id)

  const { data: allStatuses } = await supabase
    .from('weekly_status_logs')
    .select('*')
    .in('client_id', clientIds.length > 0 ? clientIds : ['no-clients'])
    .order('week_date', { ascending: false })

  let streak = 0
  const streakWeek = new Date(thisWeekMonday + 'T00:00:00')
  while (true) {
    const weekStr = streakWeek.toISOString().split('T')[0]
    const allLogged = clientIds.every((cid: string) =>
      (allStatuses || []).some((s: any) => s.client_id === cid && s.week_date === weekStr)
    )
    if (!allLogged) break
    streak++
    streakWeek.setDate(streakWeek.getDate() - 7)
  }

  const clientsWithStatus = clients.map((client: any) => {
    const logs = ((allStatuses || []) as any[]).filter((s: any) => s.client_id === client.id)
    const recentStatuses = logs.slice(0, 4)
    const hasThisWeek = logs.some((s: any) => s.week_date === thisWeekMonday)
    const currentStatus = recentStatuses[0]?.status || null

    let trend = null as ('up' | 'down' | 'flat' | null)
    if (recentStatuses.length >= 2) {
      const order: Record<string, number> = { Red: 0, Yellow: 1, Green: 2 }
      const last = order[recentStatuses[0].status]
      const prev = order[recentStatuses[1].status]
      if (last > prev) trend = 'up'
      else if (last < prev) trend = 'down'
      else trend = 'flat'
    } else if (recentStatuses.length === 1) {
      trend = 'flat'
    }

    const meta = parseClientMeta(client.details)

    return {
      id: client.id,
      name: client.name,
      account_manager: client.account_manager,
      package: client.package,
      contract_start_date: client.contract_start_date,
      contract_length: client.contract_length,
      details: client.details,
      created_at: client.created_at,
      updated_at: client.updated_at,
      current_status: currentStatus,
      trend,
      recent_statuses: recentStatuses.map((s: any) => s.status),
      pending_this_week: !hasThisWeek,
      account_size: meta.account_size ?? null,
      industry: meta.industry ?? null,
      priority: meta.priority ?? 'Medium',
    }
  })

  return <AMPanel name={decodedName} clients={clientsWithStatus} streak={streak} />
}
