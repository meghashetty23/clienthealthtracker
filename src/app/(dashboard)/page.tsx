import { createServerSupabase } from '@/lib/supabase-server'
import { VeeDashboard } from './vee-dashboard'

const ORDER: Record<string, number> = { Red: 0, Yellow: 1, Green: 2 }

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function HomePage() {
  const supabase = await createServerSupabase()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const clientIds = ((clients as any[]) || []).map((c: any) => c.id)

  const { data: allStatuses } = await supabase
    .from('weekly_status_logs')
    .select('*')
    .in('client_id', clientIds.length > 0 ? clientIds : ['no-clients'])
    .order('week_date', { ascending: true })

  const clientsArr = (clients as any[]) || []
  const statuses = (allStatuses as any[]) || []

  const latestPerClient = new Map<string, any>()
  for (const s of statuses) {
    const existing = latestPerClient.get(s.client_id)
    if (!existing || s.week_date > existing.week_date) {
      latestPerClient.set(s.client_id, s)
    }
  }

  let green = 0, yellow = 0, red = 0
  for (const c of clientsArr) {
    const latest = latestPerClient.get(c.id)
    if (!latest) continue
    if (latest.status === 'Green') green++
    else if (latest.status === 'Yellow') yellow++
    else if (latest.status === 'Red') red++
  }

  const dropAlerts: { client_id: string; client_name: string; account_manager: string; description: string; date: string }[] = []
  const staleAlerts: { client_id: string; client_name: string; account_manager: string; days: number; last_date: string }[] = []

  for (const client of clientsArr) {
    const logs = statuses
      .filter((s: any) => s.client_id === client.id)
      .sort((a: any, b: any) => a.week_date.localeCompare(b.week_date))

    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1]
      const curr = logs[i]
      const prevVal = ORDER[prev.status]
      const currVal = ORDER[curr.status]

      if (prevVal === 2 && currVal === 0) {
        dropAlerts.push({
          client_id: client.id,
          client_name: client.name,
          account_manager: client.account_manager,
          description: `${prev.status} → ${curr.status}`,
          date: formatDate(curr.week_date),
        })
      }

      if (prevVal === 2 && currVal === 1 && i + 1 < logs.length) {
        const next = logs[i + 1]
        if (ORDER[next.status] === 0) {
          dropAlerts.push({
            client_id: client.id,
            client_name: client.name,
            account_manager: client.account_manager,
            description: `${prev.status} → ${curr.status} → ${next.status} (over 2 weeks)`,
            date: formatDate(next.week_date),
          })
        }
      }
    }

    if (logs.length > 0) {
      const last = logs[logs.length - 1]
      const lastDate = new Date(last.week_date + 'T00:00:00')
      const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 7) {
        staleAlerts.push({
          client_id: client.id,
          client_name: client.name,
          account_manager: client.account_manager,
          days: diffDays,
          last_date: formatDate(last.week_date),
        })
      }
    }
  }

  const attentionItems: {
    type: 'drop' | 'stale'
    client_id: string
    client_name: string
    account_manager: string
    description: string
    date: string
    sortKey: number
  }[] = []

  for (const d of dropAlerts) {
    attentionItems.push({
      type: 'drop',
      client_id: d.client_id,
      client_name: d.client_name,
      account_manager: d.account_manager,
      description: d.description,
      date: d.date,
      sortKey: 0,
    })
  }

  for (const s of staleAlerts) {
    attentionItems.push({
      type: 'stale',
      client_id: s.client_id,
      client_name: s.client_name,
      account_manager: s.account_manager,
      description: `${s.days}d since last update`,
      date: s.last_date,
      sortKey: 1,
    })
  }

  attentionItems.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
    return 0
  })

  return (
    <VeeDashboard
      totalClients={clientsArr.length}
      green={green}
      yellow={yellow}
      red={red}
      attentionItems={attentionItems}
    />
  )
}
