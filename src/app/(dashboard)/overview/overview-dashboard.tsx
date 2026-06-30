'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

function TrendLineGraph({ data }: {
  data: { week: string; green: number; yellow: number; red: number }[]
}) {
  const w = 500, h = 200, px = 40, py = 20

  const totals = data.map((d) => d.green + d.yellow + d.red)
  const maxVal = Math.max(...totals, 1)
  const xStep = data.length > 1 ? (w - px * 2) / (data.length - 1) : 0

  const yScale = (val: number) => h - py - ((val / maxVal) * (h - py * 2))

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

  const yTicks = [0, Math.round(maxVal / 2), maxVal]

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full" style={{ minWidth: 400 }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={px} y1={yScale(t)} x2={w - px} y2={yScale(t)} stroke="#3F3F46" strokeWidth="1" />
            <text x={px - 6} y={yScale(t) + 4} textAnchor="end" className="text-[10px] fill-gray-500">{t}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d.week} x={px + i * xStep} y={h - 4} textAnchor="middle" className="text-[9px] fill-gray-500">
            {d.week}
          </text>
        ))}
        {data.length >= 2 && (
          <>
            <path
              d={buildStacked(
                data.map((d) => d.red),
                data.map(() => 0)
              )}
              fill="#DC2626"
              fillOpacity="0.85"
            />
            <path
              d={buildStacked(
                data.map((d) => d.red + d.yellow),
                data.map((d) => d.red)
              )}
              fill="#D97706"
              fillOpacity="0.85"
            />
            <path
              d={buildStacked(
                data.map((d) => d.red + d.yellow + d.green),
                data.map((d) => d.red + d.yellow)
              )}
              fill="#059669"
              fillOpacity="0.85"
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
          y={py - 4}
          textAnchor="middle"
          className="text-[9px] fill-gray-400"
        >
          current
        </text>
      </svg>
      <div className="flex justify-center gap-4 mt-1 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#059669] inline-block" /> Green</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#D97706] inline-block" /> Yellow</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#DC2626] inline-block" /> Red</span>
      </div>
    </div>
  )
}

export function OverviewDashboard({
  totalClients,
  totalWithStatus,
  overallGreen,
  overallYellow,
  overallRed,
  perAm,
  consecutiveRedCount,
  atRiskTotal = 0,
  uniqueAms = [],
  clientNames = [],
  clientWeekMap = [],
  last8Mondays = [],
  weekLabels = [],
}: {
  totalClients: number
  totalWithStatus: number
  overallGreen: number
  overallYellow: number
  overallRed: number
  perAm: Record<string, { green: number; yellow: number; red: number; total: number }>
  consecutiveRedCount: number
  atRiskTotal?: number
  uniqueAms?: string[]
  clientNames?: string[]
  clientWeekMap?: { name: string; account_manager: string; weeks: Record<string, string | null> }[]
  last8Mondays?: string[]
  weekLabels?: string[]
}) {
  const greenPct = totalWithStatus > 0 ? Math.round((overallGreen / totalWithStatus) * 100) : 0
  const yellowPct = totalWithStatus > 0 ? Math.round((overallYellow / totalWithStatus) * 100) : 0
  const redPct = totalWithStatus > 0 ? Math.round((overallRed / totalWithStatus) * 100) : 0

  const amEntries = Object.entries(perAm).sort(([a], [b]) => a.localeCompare(b))

  const [filterAm, setFilterAm] = useState('all')
  const [filterClient, setFilterClient] = useState('all')

  const sortedClientNames = useMemo(() => [...clientNames].sort(), [clientNames])

  const filteredTrend = useMemo(() => {
    const filtered = clientWeekMap.filter((c) => {
      if (filterAm !== 'all' && c.account_manager !== filterAm) return false
      if (filterClient !== 'all' && c.name !== filterClient) return false
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
      return { week: label, green: g, yellow: y, red: r }
    })
  }, [clientWeekMap, last8Mondays, filterAm, filterClient, weekLabels])

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
        <h2 className="text-base font-semibold text-gray-100 mb-4">Per Account Manager</h2>
        <div className="space-y-4">
          {amEntries.map(([name, data]) => {
            const gPct = data.total > 0 ? Math.round((data.green / data.total) * 100) : 0
            const yPct = data.total > 0 ? Math.round((data.yellow / data.total) * 100) : 0
            const rPct = data.total > 0 ? Math.round((data.red / data.total) * 100) : 0
            return (
              <div key={name} className="p-4 rounded-lg border border-[#3F3F46] bg-[#27272A]">
                <div className="flex items-center justify-between mb-2">
                  <Link href={`/account-manager/${encodeURIComponent(name)}`} className="text-sm font-semibold text-[#818CF8] hover:text-[#6366F1] hover:underline">{name}</Link>
                  <div className="text-[13px] text-gray-500">{data.total} client{data.total !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-[#1F1F23] rounded-full overflow-hidden flex">
                    {data.green > 0 && <div className="bg-[#059669] h-full transition-all" style={{ width: `${gPct}%` }} title={`Green: ${data.green}`} />}
                    {data.yellow > 0 && <div className="bg-[#D97706] h-full transition-all" style={{ width: `${yPct}%` }} title={`Yellow: ${data.yellow}`} />}
                    {data.red > 0 && <div className="bg-[#DC2626] h-full transition-all" style={{ width: `${rPct}%` }} title={`Red: ${data.red}`} />}
                  </div>
                </div>
                <div className="flex gap-4 mt-1.5 text-[13px]">
                  <span className="text-[#059669]">{data.green} Green</span>
                  <span className="text-[#D97706]">{data.yellow} Yellow</span>
                  <span className="text-[#DC2626]">{data.red} Red</span>
                </div>
              </div>
            )
          })}
        </div>
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
        </div>

        <TrendLineGraph data={filteredTrend} />
      </section>
    </div>
  )
}
