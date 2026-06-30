import { createServerSupabase } from '@/lib/supabase-server'
import { PerformanceDashboard } from './performance-dashboard'

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

export default async function PerformancePage() {
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

  const uniqueAms = [...new Set(clientsArr.map((c: any) => c.account_manager))].sort()
  const last8Mondays = getLastNMondays(8)
  const weekLabels = last8Mondays.map((w) =>
    new Date(w + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )

  // For each AM, compute the % of their clients that are Green each week
  const amData: { name: string; values: number[] }[] = []

  for (const am of uniqueAms) {
    const amClients = clientsArr.filter((c: any) => c.account_manager === am)
    const amClientIds = amClients.map((c: any) => c.id)

    const values: number[] = last8Mondays.map((week) => {
      let green = 0
      for (const cid of amClientIds) {
        const latestBeforeWeek = statuses
          .filter((s: any) => s.client_id === cid && s.week_date <= week)
          .sort((a: any, b: any) => b.week_date.localeCompare(a.week_date))[0]
        if (latestBeforeWeek?.status === 'Green') green++
      }
      return amClients.length > 0 ? Math.round((green / amClients.length) * 100) : 0
    })

    amData.push({ name: am, values })
  }

  return (
    <PerformanceDashboard
      amData={amData}
      weekLabels={weekLabels}
    />
  )
}
