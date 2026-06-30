import { createServerSupabase } from '@/lib/supabase-server'
import { AdminPanel } from './admin-panel'
import type { DropAlert, StaleAlert, StatusLogEntry, LostClientInfo, MissedSignal } from '@/lib/types'

const ORDER: Record<string, number> = { Red: 0, Yellow: 1, Green: 2 }

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function AdminPage() {
  const supabase = await createServerSupabase()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('name')

  const { data: settings } = await supabase
    .from('settings')
    .select('*')

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

  const dropAlerts: DropAlert[] = []

  for (const client of (clients as any[]) || []) {
    const logs = ((allStatuses as any[]) || [])
      .filter((s: any) => s.client_id === client.id)
      .sort((a: any, b: any) => a.week_date.localeCompare(b.week_date))

    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1]
      const curr = logs[i]
      const prevVal = ORDER[prev.status]
      const currVal = ORDER[curr.status]

      // Direct 2-level drop in one week: Green → Red
      if (prevVal === 2 && currVal === 0) {
        dropAlerts.push({
          client_name: client.name,
          account_manager: client.account_manager,
          drop_description: `${prev.status} → ${curr.status}`,
          week_date: formatDate(curr.week_date),
        })
      }

      // Consecutive 1-level drops over 2 weeks: Green→Yellow then Yellow→Red
      if (prevVal === 2 && currVal === 1 && i + 1 < logs.length) {
        const next = logs[i + 1]
        if (ORDER[next.status] === 0) {
          dropAlerts.push({
            client_name: client.name,
            account_manager: client.account_manager,
            drop_description: `${prev.status} → ${curr.status} → ${next.status} (over 2 weeks)`,
            week_date: formatDate(next.week_date),
          })
        }
      }
    }
  }

  const staleAlerts: StaleAlert[] = []
  const now = new Date()

  for (const client of (clients as any[]) || []) {
    const logs = ((allStatuses as any[]) || [])
      .filter((s: any) => s.client_id === client.id)
      .sort((a: any, b: any) => a.week_date.localeCompare(b.week_date))

    if (logs.length === 0) continue

    const last = logs[logs.length - 1]
    const lastDate = new Date(last.week_date + 'T00:00:00')
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays >= 7) {
      staleAlerts.push({
        client_name: client.name,
        account_manager: client.account_manager,
        days_since_update: diffDays,
        last_week_date: formatDate(last.week_date),
      })
    }
  }

  const clientMap = new Map<string, any>()
  for (const c of (clients as any[]) || []) clientMap.set(c.id, c)

  const statusLog: StatusLogEntry[] = ((allStatuses as any[]) || []).map((s: any) => {
    const client = clientMap.get(s.client_id)
    return {
      id: s.id,
      client_name: client?.name || 'Unknown',
      account_manager: client?.account_manager || 'Unknown',
      status: s.status,
      week_date: s.week_date,
      comment: s.comment,
      created_at: s.created_at,
    }
  })

  statusLog.sort((a, b) => new Date(b.week_date + 'T00:00:00').getTime() - new Date(a.week_date + 'T00:00:00').getTime())

  const lostSettings = ((settings as any[]) || []).filter(
    (s: any) => s.key.startsWith('client_lost:')
  )

  const lostClients: LostClientInfo[] = lostSettings.map((s: any) => {
    const clientId = s.key.replace('client_lost:', '')
    const client = clientMap.get(clientId)
    const value = JSON.parse(s.value)
    return {
      client_name: client?.name || 'Unknown',
      account_manager: client?.account_manager || 'Unknown',
      reason: value.reason || '',
      lost_at: new Date(value.lost_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    }
  })

  const lostClientIds = new Set(lostSettings.map((s: any) => s.key.replace('client_lost:', '')))

  const missedSignals: MissedSignal[] = []

  for (const client of (clients as any[]) || []) {
    if (lostClientIds.has(client.id)) continue

    const logs = ((allStatuses as any[]) || [])
      .filter((s: any) => s.client_id === client.id)
      .sort((a: any, b: any) => a.week_date.localeCompare(b.week_date))

    if (logs.length === 0) continue

    const last = logs[logs.length - 1]
    const lastDate = new Date(last.week_date + 'T00:00:00')
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (last.status === 'Red' && diffDays >= 14) {
      missedSignals.push({
        client_name: client.name,
        account_manager: client.account_manager,
        current_status: 'Red',
        days_since_update: diffDays,
        last_week_date: formatDate(last.week_date),
      })
    }
  }

  return (
    <AdminPanel
      profiles={profiles || []}
      settings={settings || []}
      dropAlerts={dropAlerts}
      staleAlerts={staleAlerts}
      statusLog={statusLog}
      lostClients={lostClients}
      missedSignals={missedSignals}
    />
  )
}
