'use client'

const AM_COLORS = ['#4F46E5', '#0891B2', '#059669', '#7C3AED', '#D97706', '#BE185D', '#2563EB', '#65A30D']

function MultiLineGraph({ data, weekLabels }: {
  data: { name: string; values: number[] }[]
  weekLabels: string[]
}) {
  const w = 600, h = 260, px = 45, py = 20

  const maxVal = 100
  const xStep = data[0]?.values.length > 1 ? (w - px * 2) / (data[0].values.length - 1) : 0

  const point = (val: number, i: number) => {
    const x = px + i * xStep
    const y = h - py - ((val / maxVal) * (h - py * 2))
    return `${x},${y}`
  }

  const drawLine = (values: number[], color: string) => {
    const pts = values.map((v, i) => point(v, i))
    return <path d={`M${pts.join(' L')}`} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
  }

  const yTicks = [0, 25, 50, 75, 100]

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full" style={{ minWidth: 500 }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={px} y1={h - py - ((t / maxVal) * (h - py * 2))} x2={w - px} y2={h - py - ((t / maxVal) * (h - py * 2))} stroke="#E5E7EB" strokeWidth="1" />
            <text x={px - 6} y={h - py - ((t / maxVal) * (h - py * 2)) + 4} textAnchor="end" className="text-[10px] fill-gray-400">{t}%</text>
          </g>
        ))}
        {weekLabels.map((label, i) => (
          <text key={i} x={px + i * xStep} y={h - 4} textAnchor="middle" className="text-[9px] fill-gray-400">
            {label}
          </text>
        ))}
        {data.map((am, idx) => (
          <g key={am.name}>
            {drawLine(am.values, AM_COLORS[idx % AM_COLORS.length])}
            {am.values.map((v, i) => (
              <circle key={i} cx={px + i * xStep} cy={h - py - ((v / maxVal) * (h - py * 2))} r="3" fill={AM_COLORS[idx % AM_COLORS.length]} />
            ))}
          </g>
        ))}
      </svg>
      <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
        {data.map((am, idx) => (
          <span key={am.name} className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: AM_COLORS[idx % AM_COLORS.length] }} />
            {am.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export function PerformanceDashboard({
  amData,
  weekLabels,
}: {
  amData: { name: string; values: number[] }[]
  weekLabels: string[]
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Performance</h1>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Account Manager Green % Over Time</h2>
        <p className="text-[13px] text-gray-500 mb-4">
          Percentage of each Account Manager&apos;s portfolio that is Green, tracked week over week.
        </p>
        <MultiLineGraph data={amData} weekLabels={weekLabels} />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Latest Week Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FAFAFA]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Manager</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Green %</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Change (4 weeks)</th>
              </tr>
            </thead>
            <tbody>
              {amData.map((am, idx) => {
                const latest = am.values[am.values.length - 1]
                const fourWeeksAgo = am.values[am.values.length - 4] ?? latest
                const change = latest - fourWeeksAgo
                const changeColor = change > 0 ? 'text-[#4F46E5]' : change < 0 ? 'text-gray-500' : 'text-gray-400'
                return (
                  <tr key={am.name} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: AM_COLORS[idx % AM_COLORS.length] }} />
                      {am.name}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{latest}%</td>
                    <td className={`px-4 py-3 ${changeColor}`}>
                      {change > 0 ? '+' : ''}{change}pp
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
