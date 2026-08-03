'use client'

import { useState, useMemo } from 'react'

function TrendLineGraph({ data }: {
  data: { week: string; green: number; yellow: number; red: number }[]
}) {
  const w = 500, h = 200, px = 40, py = 20

  const xStep = data.length > 1 ? (w - px * 2) / (data.length - 1) : 0

  const yScale = (val: number) => h - py - ((val / 100) * (h - py * 2))

  const buildStacked = (topValues: number[], bottomValues: number[]) => {
    if (data.length < 2) return ''
    const n = data.length
    const top = topValues.map((v, i) => `${px + i * xStep},${yScale(v)}`).join(' L ')
    const bottom = bottomValues.map((v, i) => {
      const ri = n - 1 - i
      return `${px + ri * xStep},${yScale(v)}`
    }).join(' L ')
    return `M${top} L ${bottom} Z`
  }

  const yTicks = [0, 25, 50, 75, 100]

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full" style={{ minWidth: 400 }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={px} y1={yScale(t)} x2={w - px} y2={yScale(t)} stroke="#3F3F46" strokeWidth="1" />
            <text x={px - 8} y={yScale(t) + 4} textAnchor="end" className="text-[10px] fill-[#9CA3AF]">{t}%</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d.week} x={px + i * xStep} y={h - 4} textAnchor="middle" className="text-[9px] fill-[#9CA3AF]">
            {d.week}
          </text>
        ))}
        {data.length >= 2 && (
          <>
            <path
              d={buildStacked(
                data.map((d) => d.green + d.yellow + d.red),
                data.map((d) => d.green + d.yellow)
              )}
              fill="#EF4444"
            />
            <path
              d={buildStacked(
                data.map((d) => d.green + d.yellow),
                data.map((d) => d.green)
              )}
              fill="#F59E0B"
            />
            <path
              d={buildStacked(
                data.map((d) => d.green),
                data.map(() => 0)
              )}
              fill="#10B981"
            />
          </>
        )}
        <line
          x1={px + (data.length - 1) * xStep}
          y1={py}
          x2={px + (data.length - 1) * xStep}
          y2={h - py}
          stroke="#9CA3AF"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <text
          x={px + (data.length - 1) * xStep}
          y={py - 6}
          textAnchor="middle"
          className="text-[11px] fill-[#9CA3AF]"
        >
          current
        </text>
      </svg>
      <div className="flex justify-center gap-6 mt-3 text-xs text-[#9CA3AF]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" /> Green</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block" /> Yellow</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block" /> Red</span>
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
  clientNames = [],
  clientWeekMap = [],
  last8Mondays = [],
  weekLabels = [],
  uniquePriorities = [],
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
  clientNames?: string[]
  clientWeekMap?: { name: string; account_manager: string; priority: string; weeks: Record<string, string | null> }[]
  last8Mondays?: string[]
  weekLabels?: string[]
  uniquePriorities?: string[]
  clientStatuses?: ClientStatusEntry[]
}) {
  const greenPct = totalWithStatus > 0 ? Math.round((overallGreen / totalWithStatus) * 100) : 0
  const yellowPct = totalWithStatus > 0 ? Math.round((overallYellow / totalWithStatus) * 100) : 0
  const redPct = totalWithStatus > 0 ? Math.round((overallRed / totalWithStatus) * 100) : 0

  const [filterAm, setFilterAm] = useState('all')
  const [filterClient, setFilterClient] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const sortedClientNames = useMemo(() => [...clientNames].sort(), [clientNames])

  const filteredTrend = useMemo(() => {
    const filtered = clientWeekMap.filter((c) => {
      if (filterAm !== 'all' && c.account_manager !== filterAm) return false
      if (filterClient !== 'all' && c.name !== filterClient) return false
      if (filterPriority !== 'all' && c.priority !== filterPriority) return false
      return true
    })

    return last8Mondays.map((week, i) => {
      const label = weekLabels[i] || week
      let g = 0, y = 0, r = 0
      for (const c of filtered) {
        const status = c.weeks[week]
        if (status === 'Green') g++
        else if (status === 'Yellow') y++
        else if (status === 'Red') r++
      }
      const total = g + y + r
      if (total === 0) return { week: label, green: 0, yellow: 0, red: 0 }
      const greenPct = Math.round((g / total) * 100)
      const yellowPct = Math.round((y / total) * 100)
      const redPct = 100 - greenPct - yellowPct
      return { week: label, green: greenPct, yellow: yellowPct, red: redPct }
    })
  }, [clientWeekMap, last8Mondays, filterAm, filterClient, filterPriority, weekLabels])

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
        <h2 className="text-base font-semibold text-gray-100 mb-4">8-Week Trend</h2>

        <div className="flex flex-wrap gap-3 mb-4">
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
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Clients</option>
            {sortedClientNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Priorities</option>
            {uniquePriorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <TrendLineGraph data={filteredTrend} />
      </section>
    </div>
  )
}
