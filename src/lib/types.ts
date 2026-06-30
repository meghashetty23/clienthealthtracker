export type Role = 'admin' | 'account_manager' | 'viewer'

export interface Profile {
  id: string
  name: string
  role: Role
  created_at: string
}

export interface ClientMeta {
  account_size?: number
  industry?: string
  priority?: 'High' | 'Medium' | 'Low'
  notes?: string
}

export interface Client {
  id: string
  name: string
  account_manager: string
  package: string
  contract_start_date: string
  contract_length: string
  details: string | null
  created_at: string
  updated_at: string
}

export function parseClientMeta(details: string | null): ClientMeta & { rawNotes?: string } {
  if (!details) return {}
  try {
    const parsed = JSON.parse(details)
    if (parsed && typeof parsed === 'object' && ('account_size' in parsed || 'industry' in parsed || 'priority' in parsed || 'notes' in parsed)) {
      return parsed as ClientMeta
    }
  } catch {}
  return { rawNotes: details }
}

export function buildClientDetails(meta: ClientMeta, existingDetails: string | null): string {
  const existing = parseClientMeta(existingDetails)
  return JSON.stringify({
    ...existing,
    ...meta,
  })
}

export type StatusColor = 'Green' | 'Yellow' | 'Red'

export interface WeeklyStatus {
  id: string
  client_id: string
  status: StatusColor
  week_date: string
  comment: string | null
  created_by: string
  created_at: string
}

export type TrendArrow = 'up' | 'down' | 'flat'

export interface ClientWithStatus extends Client {
  current_status: StatusColor | null
  trend: TrendArrow | null
  recent_statuses: (StatusColor | null)[]
  pending_this_week: boolean
  account_size: number | null
  industry: string | null
  priority: 'High' | 'Medium' | 'Low'
}

export interface AppSetting {
  key: string
  value: string
  updated_by: string | null
  updated_at: string
}

export interface DropAlert {
  client_name: string
  account_manager: string
  drop_description: string
  week_date: string
}

export interface StaleAlert {
  client_name: string
  account_manager: string
  days_since_update: number
  last_week_date: string
}

export interface LostClientInfo {
  client_name: string
  account_manager: string
  reason: string
  lost_at: string
}

export interface MissedSignal {
  client_name: string
  account_manager: string
  current_status: StatusColor
  days_since_update: number
  last_week_date: string
}

export interface StatusLogEntry {
  id: string
  client_name: string
  account_manager: string
  status: StatusColor
  week_date: string
  comment: string | null
  created_at: string
}

