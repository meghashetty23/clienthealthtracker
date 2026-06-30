'use client'

import Link from 'next/link'

export function VeeDashboard({
  totalClients,
  green,
  yellow,
  red,
  attentionItems,
}: {
  totalClients: number
  green: number
  yellow: number
  red: number
  attentionItems: {
    type: 'drop' | 'stale'
    client_id: string
    client_name: string
    account_manager: string
    description: string
    date: string
  }[]
}) {
  const totalWithStatus = green + yellow + red

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Current Status Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/clients" className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-[#059669] p-4 text-center hover:border-gray-300 transition-colors">
            <div className="text-4xl font-semibold text-[#059669]">{green}</div>
            <div className="text-sm text-gray-500 mt-2">Green</div>
            <div className="text-[13px] text-gray-400 mt-1">{totalWithStatus > 0 ? Math.round((green / totalWithStatus) * 100) : 0}%</div>
          </Link>
          <Link href="/clients" className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-[#D97706] p-4 text-center hover:border-gray-300 transition-colors">
            <div className="text-4xl font-semibold text-[#D97706]">{yellow}</div>
            <div className="text-sm text-gray-500 mt-2">Yellow</div>
            <div className="text-[13px] text-gray-400 mt-1">{totalWithStatus > 0 ? Math.round((yellow / totalWithStatus) * 100) : 0}%</div>
          </Link>
          <Link href="/clients" className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-[#DC2626] p-4 text-center hover:border-gray-300 transition-colors">
            <div className="text-4xl font-semibold text-[#DC2626]">{red}</div>
            <div className="text-sm text-gray-500 mt-2">Red</div>
            <div className="text-[13px] text-gray-400 mt-1">{totalWithStatus > 0 ? Math.round((red / totalWithStatus) * 100) : 0}%</div>
          </Link>
        </div>
        {totalWithStatus < totalClients && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            {totalClients - totalWithStatus} client{(totalClients - totalWithStatus) !== 1 ? 's' : ''} with no status logged yet
          </p>
        )}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Needs Your Attention</h2>
        <p className="text-[13px] text-gray-500 mb-4">
          Clients with status drops and clients not updated in 7+ days.
        </p>

        {attentionItems.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No items need attention right now.</p>
        ) : (
          <div className="space-y-3">
            {attentionItems.map((item, i) => (
              <div
                key={`${item.type}-${i}`}
                className={`flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 border-l-4 ${
                  item.type === 'drop' ? 'border-l-[#DC2626]' : 'border-l-[#D97706]'
                }`}
              >
                <span className={`text-lg leading-none flex-shrink-0 ${item.type === 'drop' ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                  {item.type === 'drop' ? '\u26A0' : '\u23F1'}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/clients/${item.client_id}`}
                    className="text-sm font-medium text-gray-900 hover:text-[#4F46E5] hover:underline"
                  >
                    {item.client_name}
                  </Link>
                  <div className="text-[13px] text-gray-500">
                    {item.account_manager} &middot; {item.description}
                  </div>
                </div>
                <span className="text-[13px] text-gray-400 whitespace-nowrap flex-shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-4 text-sm text-gray-400 pt-2">
        <Link href="/clients" className="text-[#4F46E5] hover:text-[#4338CA] hover:underline">
          View all clients &rarr;
        </Link>
        <Link href="/admin" className="text-[#4F46E5] hover:text-[#4338CA] hover:underline">
          View all alerts &rarr;
        </Link>
      </div>
    </div>
  )
}
