import { createServerSupabase } from '@/lib/supabase-server'
import { OverviewDashboard } from './overview-dashboard'
import { parseClientMeta } from '@/lib/types'

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}

function getLastNMondays(n: number): string[] {
  const mondays: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i * 7)
    mondays.push(getMonday(d))
  }
  return mondays
}

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

  const perAm: Record<string, { green: number; yellow: number; red: number; total: number }> = {}

  for (const c of clientsArr) {
    const am = c.account_manager
    if (!perAm[am]) perAm[am] = { green: 0, yellow: 0, red: 0, total: 0 }
    perAm[am].total++

    const latest = latestPerClient.get(c.id)
    if (!latest) { noStatus++; continue }

    const meta = parseClientMeta(c.details)

    if (latest.status === 'Green') { overallGreen++; perAm[am].green++ }
    else if (latest.status === 'Yellow') { overallYellow++; perAm[am].yellow++ }
    else if (latest.status === 'Red') {
      overallRed++; perAm[am].red++
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

  const last8Mondays = getLastNMondays(8)
  const weekLabels = last8Mondays.map((w) =>
    new Date(w + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  )

  // Build per-client weekly status map for client-side filtering
  const clientWeekMap: { name: string; account_manager: string; priority: string; weeks: Record<string, string | null> }[] = []
  const uniqueAms = [...new Set(clientsArr.map((c: any) => c.account_manager))].sort()
  const clientNames = clientsArr.map((c: any) => c.name)
  const allPriorities = new Set<string>()

  for (const c of clientsArr) {
    const weeks: Record<string, string | null> = {}
    const clientLogs = statuses
      .filter((s: any) => s.client_id === c.id)
      .sort((a: any, b: any) => a.week_date.localeCompare(b.week_date))
    const firstStatus = clientLogs.length > 0 ? clientLogs[0].status : null
    const meta = parseClientMeta(c.details)

    for (const week of last8Mondays) {
      const weekLog = clientLogs
        .filter((s: any) => s.week_date <= week)
        .sort((a: any, b: any) => b.week_date.localeCompare(a.week_date))[0]
      weeks[week] = weekLog?.status || firstStatus
    }
    const priority = meta.priority ?? 'Medium'
    allPriorities.add(priority)
    clientWeekMap.push({ name: c.name, account_manager: c.account_manager, priority, weeks })
  }

  const uniquePriorities = ['High', 'Medium', 'Low'].filter((p) => allPriorities.has(p))

  return (
    <OverviewDashboard
      totalClients={clientsArr.length}
      totalWithStatus={totalWithStatus}
      overallGreen={overallGreen}
      overallYellow={overallYellow}
      overallRed={overallRed}
      perAm={perAm}
      consecutiveRedCount={consecutiveRedCount}
      atRiskTotal={atRiskTotal}
      uniqueAms={uniqueAms}
      clientNames={clientNames}
      clientWeekMap={clientWeekMap}
      last8Mondays={last8Mondays}
      weekLabels={weekLabels}
      uniquePriorities={uniquePriorities}
    />
  )
}
