'use client'

import { useState, useMemo } from 'react'

const STATUS_COLORS: Record<string, string> = {
  Green: '#10B981',
  Yellow: '#F59E0B',
  Red: '#EF4444',
}

function DonutChart({ green, yellow, red }: { green: number; yellow: number; red: number }) {
  const total = green + yellow + red
  const size = 220
  const stroke = 26
  const cx = size / 2
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  let cumulative = 0
  const segments = [
    { label: 'Green', value: green, color: STATUS_COLORS.Green },
    { label: 'Yellow', value: yellow, color: STATUS_COLORS.Yellow },
    { label: 'Red', value: red, color: STATUS_COLORS.Red },
  ]

  const arcs = total > 0
    ? segments.map((seg) => {
        const len = (seg.value / total) * c
        const el = (
          <circle
            key={seg.label}
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-cumulative}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        )
        cumulative += len
        return el
      })
    : []

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1F1F23" strokeWidth={stroke} />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold text-gray-100">{total}</div>
        <div className="text-sm text-gray-400">clients</div>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: 'text-[#818CF8] border border-[#818CF8]/30',
    Medium: 'text-gray-400 border border-[#3F3F46]',
    Low: 'text-gray-500 border border-[#3F3F46]',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[priority] || styles.Medium}`}>
      {priority}
    </span>
  )
}

function HealthSnapshotSection({ clientStatuses, uniqueAms }: {
  clientStatuses: ClientStatusEntry[]
  uniqueAms: string[]
}) {
  const [filterAm, setFilterAm] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const filtered = useMemo(
    () => clientStatuses.filter((c) => {
      if (filterAm !== 'all' && c.account_manager !== filterAm) return false
      if (filterPriority !== 'all' && c.priority !== filterPriority) return false
      return true
    }),
    [clientStatuses, filterAm, filterPriority]
  )

  const counts = useMemo(() => {
    let green = 0
    let yellow = 0
    let red = 0
    const redClients: ClientStatusEntry[] = []
    for (const c of filtered) {
      if (c.status === 'Green') green++
      else if (c.status === 'Yellow') yellow++
      else if (c.status === 'Red') {
        red++
        redClients.push(c)
      }
    }
    return { green, yellow, red, redClients }
  }, [filtered])

  const total = counts.green + counts.yellow + counts.red
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  const stats = [
    { label: 'Green', count: counts.green, color: STATUS_COLORS.Green },
    { label: 'Yellow', count: counts.yellow, color: STATUS_COLORS.Yellow },
    { label: 'Red', count: counts.red, color: STATUS_COLORS.Red },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Account Manager</label>
          <select
            value={filterAm}
            onChange={(e) => setFilterAm(e.target.value)}
            className="px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Account Managers</option>
            {uniqueAms.map((am) => (
              <option key={am} value={am}>{am}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        <DonutChart green={counts.green} yellow={counts.yellow} red={counts.red} />
        <div className="space-y-2">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span style={{ color: s.color }}>
                {s.label} · {s.count} · {pct(s.count)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-100 mb-2">At risk right now</h3>
        {counts.redClients.length === 0 ? (
          <p className="text-sm text-gray-500">No clients at risk right now.</p>
        ) : (
          <ul className="divide-y divide-[#3F3F46]/50">
            {counts.redClients.map((c) => (
              <li key={c.name} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-100">{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-gray-400">{c.account_manager}</span>
                  <PriorityBadge priority={c.priority} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const STATUS_SHADES: Record<string, { high: string; medium: string; low: string }> = {
  Green: { high: '#047857', medium: '#10B981', low: '#6EE7B7' },
  Yellow: { high: '#B45309', medium: '#F59E0B', low: '#FCD34D' },
  Red: { high: '#B91C1C', medium: '#EF4444', low: '#FCA5A5' },
}

type ClientStatusEntry = {
  name: string
  account_manager: string
  priority: string
  status: string | null
}

function StatusBreakdownChart({ clientStatuses, uniqueAms }: {
  clientStatuses: ClientStatusEntry[]
  uniqueAms: string[]
}) {
  const [filterAm, setFilterAm] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const counts = useMemo(() => {
    const initial = {
      Green: { High: 0, Medium: 0, Low: 0 },
      Yellow: { High: 0, Medium: 0, Low: 0 },
      Red: { High: 0, Medium: 0, Low: 0 },
    }
    for (const c of clientStatuses) {
      if (filterAm !== 'all' && c.account_manager !== filterAm) continue
      if (filterPriority !== 'all' && c.priority !== filterPriority) continue
      if (c.status !== 'Green' && c.status !== 'Yellow' && c.status !== 'Red') continue
      const pri = c.priority === 'High' ? 'High' : c.priority === 'Low' ? 'Low' : 'Medium'
      initial[c.status][pri]++
    }
    const totalFor = (o: Record<string, number>) => o.High + o.Medium + o.Low
    return {
      ...initial,
      totals: {
        Green: totalFor(initial.Green),
        Yellow: totalFor(initial.Yellow),
        Red: totalFor(initial.Red),
      },
    }
  }, [clientStatuses, filterAm, filterPriority])

  const { totals } = counts
  const shownTotal = totals.Green + totals.Yellow + totals.Red
  const maxCount = Math.max(totals.Green, totals.Yellow, totals.Red, 1)
  const maxBarHeight = 170

  const filterLabel = [filterAm !== 'all' ? filterAm : null, filterPriority !== 'all' ? `${filterPriority} Priority` : null]
    .filter(Boolean)
    .join(' · ')

  const renderBar = (status: 'Green' | 'Yellow' | 'Red') => {
    const segs = counts[status]
    const total = totals[status]
    const shades = STATUS_SHADES[status]
    const barHeight = total > 0 ? Math.round((total / maxCount) * maxBarHeight) : 0
    return (
      <div key={status} className="flex-1 flex flex-col items-center justify-end h-56">
        <span className="text-sm font-medium text-gray-300 mb-1.5">{total}</span>
        <div
          className="w-14 sm:w-24 rounded-t-md overflow-hidden"
          style={{ height: barHeight }}
        >
          <div style={{ height: total > 0 ? `${(segs.High / total) * 100}%` : 0, backgroundColor: shades.high }} title={`High priority: ${segs.High}`} />
          <div style={{ height: total > 0 ? `${(segs.Medium / total) * 100}%` : 0, backgroundColor: shades.medium }} title={`Medium priority: ${segs.Medium}`} />
          <div style={{ height: total > 0 ? `${(segs.Low / total) * 100}%` : 0, backgroundColor: shades.low }} title={`Low priority: ${segs.Low}`} />
        </div>
        <span className="mt-2 text-xs text-gray-400">{status}</span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Account Manager</label>
          <select
            value={filterAm}
            onChange={(e) => setFilterAm(e.target.value)}
            className="px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Account Managers</option>
            {uniqueAms.map((am) => (
              <option key={am} value={am}>{am}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className="flex items-end gap-4 sm:gap-8">
        {renderBar('Green')}
        {renderBar('Yellow')}
        {renderBar('Red')}
      </div>

      <p className="text-sm text-gray-400 mt-4 text-center">
        Showing {shownTotal} client{shownTotal !== 1 ? 's' : ''} — {totals.Green} Green, {totals.Yellow} Yellow, {totals.Red} Red{filterLabel ? ` (${filterLabel})` : ''}
      </p>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-3 text-xs text-[#9CA3AF]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" /> Green</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block" /> Yellow</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block" /> Red</span>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Within each bar, darker shade = High priority, medium = Medium priority, lighter = Low priority.
      </p>
    </div>
  )
}

export function OverviewDashboard({
  totalClients,
  totalWithStatus,
  overallGreen,
  overallYellow,
  overallRed,
  consecutiveRedCount,
  atRiskTotal = 0,
  uniqueAms = [],
  clientStatuses = [],
}: {
  totalClients: number
  totalWithStatus: number
  overallGreen: number
  overallYellow: number
  overallRed: number
  consecutiveRedCount: number
  atRiskTotal?: number
  uniqueAms?: string[]
  clientStatuses?: ClientStatusEntry[]
}) {
  const greenPct = totalWithStatus > 0 ? Math.round((overallGreen / totalWithStatus) * 100) : 0
  const yellowPct = totalWithStatus > 0 ? Math.round((overallYellow / totalWithStatus) * 100) : 0
  const redPct = totalWithStatus > 0 ? Math.round((overallRed / totalWithStatus) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-100">Portfolio Overview</h1>

      <section className="bg-[#27272A] rounded-xl border border-[#3F3F46] p-4">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Current Overall Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#27272A] border border-[#3F3F46] border-l-4 border-l-[#059669] p-4 text-center">
            <div className="text-4xl font-semibold text-[#059669]">{overallGreen}</div>
            <div className="text-sm text-gray-400 mt-2">Green</div>
            <div className="text-[13px] text-gray-500 mt-1">{greenPct}%</div>
          </div>
          <div className="rounded-xl bg-[#27272A] border border-[#3F3F46] border-l-4 border-l-[#D97706] p-4 text-center">
            <div className="text-4xl font-semibold text-[#D97706]">{overallYellow}</div>
            <div className="text-sm text-gray-400 mt-2">Yellow</div>
            <div className="text-[13px] text-gray-500 mt-1">{yellowPct}%</div>
          </div>
          <div className="rounded-xl bg-[#27272A] border border-[#3F3F46] border-l-4 border-l-[#DC2626] p-4 text-center">
            <div className="text-4xl font-semibold text-[#DC2626]">{overallRed}</div>
            <div className="text-sm text-gray-400 mt-2">Red</div>
            <div className="text-[13px] text-gray-500 mt-1">{redPct}%</div>
          </div>
        </div>
        {totalWithStatus < totalClients && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            {totalClients - totalWithStatus} client{(totalClients - totalWithStatus) !== 1 ? 's' : ''} with no status logged yet
          </p>
        )}
      </section>

      {atRiskTotal > 0 && (
        <section className="bg-[#27272A] rounded-xl border border-[#3F3F46] border-l-4 border-l-[#DC2626] p-4">
          <div className="flex items-center gap-1">
            <span className="text-[#DC2626] text-2xl">&#9888;</span>
            <div className="ml-3">
              <div className="text-base font-semibold text-gray-100">
                ฿{atRiskTotal.toLocaleString('en-US')} at risk this week
              </div>
              <p className="text-sm text-gray-400">
                Total account size currently in Red status.
              </p>
            </div>
          </div>
        </section>
      )}

      {consecutiveRedCount > 0 && (
        <section className="bg-[#27272A] rounded-xl border border-[#3F3F46] border-l-4 border-l-[#DC2626] p-4">
          <div className="flex items-center gap-1">
            <span className="text-[#DC2626] text-2xl">&#9888;</span>
            <div className="ml-3">
              <div className="text-base font-semibold text-gray-100">
                {consecutiveRedCount} client{consecutiveRedCount !== 1 ? 's' : ''} Red for 2+ weeks
              </div>
              <p className="text-sm text-gray-400">
                Multiple consecutive weeks at Red is a stronger warning sign.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#27272A] rounded-xl border border-[#3F3F46] p-4">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Status &amp; Priority Breakdown</h2>

        <StatusBreakdownChart clientStatuses={clientStatuses} uniqueAms={uniqueAms} />
      </section>

      <section className="bg-[#27272A] rounded-xl border border-[#3F3F46] p-4">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Current Health Snapshot</h2>

        <HealthSnapshotSection clientStatuses={clientStatuses} uniqueAms={uniqueAms} />
      </section>
    </div>
  )
}
