'use client'

import Link from 'next/link'
import type { StatusColor } from '@/lib/types'

function TrendDots({ statuses }: { statuses: (StatusColor | null)[] }) {
  const colors: Record<string, string> = {
    Green: 'bg-emerald-500',
    Yellow: 'bg-amber-400',
    Red: 'bg-red-500',
  }
  const dots = []
  for (let i = 3; i >= 0; i--) {
    const s = statuses[i]
    dots.push(
      <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full ${s ? colors[s] : 'bg-gray-200'}`} />
    )
  }
  return <div className="flex items-center gap-1">{dots}</div>
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#1F1F23] text-gray-500">No log</span>
  }
  const styles: Record<string, string> = {
    Green: 'bg-[#064E3B] text-[#34D399] ring-[#34D399]/20',
    Yellow: 'bg-[#422006] text-[#FBBF24] ring-[#FBBF24]/20',
    Red: 'bg-[#450A0A] text-[#EF4444] ring-[#EF4444]/20',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${styles[status]}`}>{status}</span>
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: 'text-[#818CF8] border border-[#818CF8]/30',
    Medium: 'text-gray-400 border border-[#3F3F46]',
    Low: 'text-gray-500 border border-[#3F3F46]',
  }
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[priority] || styles.Medium}`}>{priority}</span>
}

export function AMPanel({
  name,
  clients,
  streak = 0,
}: {
  name: string
  clients: any[]
  streak?: number
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-sm text-gray-400 hover:text-gray-100">&larr; Back</Link>
        <h1 className="text-2xl font-semibold text-gray-100">{name}</h1>
        <span className="text-[13px] text-gray-400">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
        {streak > 0 && (
          <span className="text-[13px] text-gray-500">
            &middot; {streak}-week streak
          </span>
        )}
      </div>

      <div className="bg-[#27272A] rounded-xl border border-[#3F3F46] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3F3F46] bg-[#1F1F23]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Package</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Account Size</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Priority</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">4-Week Trend</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3F3F46]/50">
            {clients.map((client: any) => (
              <tr key={client.id} className="hover:bg-[#1F1F23] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/clients/${client.id}`} className="text-sm font-medium text-[#818CF8] hover:text-[#6366F1] hover:underline">
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">{client.package}</td>
                <td className="px-4 py-3 text-sm hidden md:table-cell">
                  {client.account_size != null
                    ? <span className="text-gray-100">฿{client.account_size.toLocaleString('en-US')}</span>
                    : <span className="text-gray-500">Not set</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell"><PriorityBadge priority={client.priority} /></td>
                <td className="px-4 py-3 text-center"><div className="flex justify-center"><TrendDots statuses={client.recent_statuses} /></div></td>
                <td className="px-4 py-3 text-center"><StatusBadge status={client.current_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
