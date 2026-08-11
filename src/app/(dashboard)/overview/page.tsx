import { createServerSupabase } from '@/lib/supabase-server'
import { OverviewDashboard } from './overview-dashboard'
import { parseClientMeta } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const supabase = await createServerSupabase()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const { data: allStatuses } = await supabase
    .from('weekly_status_logs')
    .select('*')
    .order('week_date', { ascending: true })

  const statuses = (allStatuses as any[]) || []
  const clientsArr = (clients as any[]) || []

  const latestPerClient = new Map<string, any>()
  for (const s of statuses) {
    const existing = latestPerClient.get(s.client_id)
    if (!existing || s.week_date > existing.week_date) {
      latestPerClient.set(s.client_id, s)
    }
  }

  let overallGreen = 0
  let overallYellow = 0
  let overallRed = 0
  let noStatus = 0
  let atRiskTotal = 0

  for (const c of clientsArr) {
    const latest = latestPerClient.get(c.id)
    if (!latest) { noStatus++; continue }

    const meta = parseClientMeta(c.details)

    if (latest.status === 'Green') { overallGreen++ }
    else if (latest.status === 'Yellow') { overallYellow++ }
    else if (latest.status === 'Red') {
      overallRed++
      if (meta.account_size) atRiskTotal += meta.account_size
    }
  }

  const totalWithStatus = clientsArr.length - noStatus

  let consecutiveRedCount = 0
  for (const c of clientsArr) {
    const clientLogs = statuses
      .filter((s: any) => s.client_id === c.id)
      .sort((a: any, b: any) => b.week_date.localeCompare(a.week_date))
    for (let i = 0; i < clientLogs.length - 1; i++) {
      if (clientLogs[i].status === 'Red' && clientLogs[i + 1].status === 'Red') {
        const currDate = new Date(clientLogs[i].week_date + 'T00:00:00')
        const prevDate = new Date(clientLogs[i + 1].week_date + 'T00:00:00')
        const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays <= 10) { consecutiveRedCount++; break }
      }
    }
  }

  const uniqueAms = [...new Set(clientsArr.map((c: any) => c.account_manager))].sort()

  const clientStatuses = clientsArr.map((c) => {
    const latest = latestPerClient.get(c.id)
    const meta = parseClientMeta(c.details)
    return {
      name: c.name,
      account_manager: c.account_manager,
      priority: meta.priority ?? 'Medium',
      status: latest?.status ?? null,
    }
  })

  return (
    <OverviewDashboard
      totalClients={clientsArr.length}
      totalWithStatus={totalWithStatus}
      overallGreen={overallGreen}
      overallYellow={overallYellow}
      overallRed={overallRed}
      consecutiveRedCount={consecutiveRedCount}
      atRiskTotal={atRiskTotal}
      uniqueAms={uniqueAms}
      clientStatuses={clientStatuses}
    />
  )
}
