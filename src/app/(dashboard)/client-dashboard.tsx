'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/app/actions/clients'
import type { ClientWithStatus, StatusColor } from '@/lib/types'

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
      <span
        key={i}
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          s ? colors[s] : 'bg-gray-200'
        }`}
      />
    )
  }

  return <div className="flex items-center gap-1">{dots}</div>
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#1F1F23] text-gray-500">
        No log
      </span>
    )
  }

  const styles: Record<string, string> = {
    Green: 'bg-[#064E3B] text-[#34D399] ring-[#34D399]/20',
    Yellow: 'bg-[#422006] text-[#FBBF24] ring-[#FBBF24]/20',
    Red: 'bg-[#450A0A] text-[#EF4444] ring-[#EF4444]/20',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
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

function SummaryCard({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string
  count: number
  color: string
  active: boolean
  onClick: () => void
}) {
  const borderColors: Record<string, string> = {
    Green: 'border-l-[#059669]',
    Yellow: 'border-l-[#D97706]',
    Red: 'border-l-[#DC2626]',
    Gray: 'border-l-gray-400',
  }

  const countColors: Record<string, string> = {
    Green: 'text-[#059669]',
    Yellow: 'text-[#D97706]',
    Red: 'text-[#DC2626]',
    Gray: 'text-gray-100',
  }

  const activeStyles: Record<string, string> = {
    Green: 'ring-2 ring-[#059669]/30',
    Yellow: 'ring-2 ring-[#D97706]/30',
    Red: 'ring-2 ring-[#DC2626]/30',
    Gray: 'ring-2 ring-[#52525B]',
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl border border-[#3F3F46] border-l-4 text-left transition-all cursor-pointer bg-[#27272A]
        ${active ? activeStyles[color] : 'hover:border-[#52525B]'}
        ${borderColors[color]}`}
    >
      <div className={`text-2xl font-semibold ${countColors[color]}`}>{count}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </button>
  )
}

export function ClientDashboard({
  clients,
}: {
  clients: ClientWithStatus[]
}) {
  const [filter, setFilter] = useState<'all' | StatusColor>('all')
  const [sortBy, setSortBy] = useState<'name' | 'account_manager' | 'status' | 'account_size'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const toggleSort = (field: 'name' | 'account_manager' | 'status' | 'account_size') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(field)
      setSortAsc(true)
    }
  }

  const statusOrder: Record<string, number> = { Green: 0, Yellow: 1, Red: 2 }

  const filteredClients = useMemo(() => {
    let result = filter === 'all'
      ? [...clients]
      : clients.filter((c) => c.current_status === filter)

    result.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'account_manager') cmp = a.account_manager.localeCompare(b.account_manager)
      else if (sortBy === 'status') {
        const ao = a.current_status ? statusOrder[a.current_status] ?? 3 : 3
        const bo = b.current_status ? statusOrder[b.current_status] ?? 3 : 3
        cmp = ao - bo
      } else if (sortBy === 'account_size') {
        cmp = (a.account_size ?? -1) - (b.account_size ?? -1)
      }
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [clients, filter, sortBy, sortAsc])

  const counts = {
    Green: clients.filter((c) => c.current_status === 'Green').length,
    Yellow: clients.filter((c) => c.current_status === 'Yellow').length,
    Red: clients.filter((c) => c.current_status === 'Red').length,
  }

  const totalWithStatus = counts.Green + counts.Yellow + counts.Red
  const noStatus = clients.length - totalWithStatus

  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formAm, setFormAm] = useState('')
  const [formPkg, setFormPkg] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formLen, setFormLen] = useState('')
  const [formSize, setFormSize] = useState('')
  const [formIndustry, setFormIndustry] = useState('')
  const [formPriority, setFormPriority] = useState('Medium')
  const [formNotes, setFormNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    const fd = new FormData()
    fd.set('name', formName)
    fd.set('account_manager', formAm)
    fd.set('package', formPkg)
    fd.set('contract_start_date', formStart)
    fd.set('contract_length', formLen)
    fd.set('account_size', formSize)
    fd.set('industry', formIndustry)
    fd.set('priority', formPriority)
    fd.set('details', formNotes)

    try {
      await createClient(fd)
      setShowForm(false)
      setFormName('')
      setFormAm('')
      setFormPkg('')
      setFormStart('')
      setFormLen('')
      setFormSize('')
      setFormIndustry('')
      setFormPriority('Medium')
      setFormNotes('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setFormLoading(false)
    }
  }

  function toggleFilter(status: 'all' | StatusColor) {
    setFilter((prev) => (prev === status ? 'all' : status))
  }

  const sortIndicator = (field: 'name' | 'account_manager' | 'status' | 'account_size') => {
    if (sortBy !== field) return null
    return <span className="ml-1">{sortAsc ? '\u25B2' : '\u25BC'}</span>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-100">Clients</h1>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-gray-400">{clients.length} total</span>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#4F46E5] text-white py-1.5 px-3 rounded-lg text-sm font-medium hover:bg-[#4338CA] transition-colors cursor-pointer"
          >
            + Add Client
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <SummaryCard
          label="All clients"
          count={clients.length}
          color="Gray"
          active={filter === 'all'}
          onClick={() => toggleFilter('all')}
        />
        <SummaryCard
          label="Healthy"
          count={counts.Green}
          color="Green"
          active={filter === 'Green'}
          onClick={() => toggleFilter('Green')}
        />
        <SummaryCard
          label="Watch"
          count={counts.Yellow}
          color="Yellow"
          active={filter === 'Yellow'}
          onClick={() => toggleFilter('Yellow')}
        />
        <SummaryCard
          label="At risk"
          count={counts.Red}
          color="Red"
          active={filter === 'Red'}
          onClick={() => toggleFilter('Red')}
        />
      </div>

      <div className="bg-[#27272A] rounded-xl border border-[#3F3F46] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3F3F46] bg-[#1F1F23]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <button onClick={() => toggleSort('name')} className="hover:text-gray-100 cursor-pointer">
                  Name{sortIndicator('name')}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                <button onClick={() => toggleSort('account_manager')} className="hover:text-gray-100 cursor-pointer">
                  Account Manager{sortIndicator('account_manager')}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                <button onClick={() => toggleSort('account_size')} className="hover:text-gray-100 cursor-pointer">
                  Account Size{sortIndicator('account_size')}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Priority
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                4-Week Trend
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <button onClick={() => toggleSort('status')} className="hover:text-gray-100 cursor-pointer">
                  Status{sortIndicator('status')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3F3F46]/50">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-[#1F1F23] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-sm font-medium text-[#818CF8] hover:text-[#6366F1] hover:underline"
                      >
                        {client.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">
                    <Link
                      href={`/account-manager/${encodeURIComponent(client.account_manager)}`}
                      className="text-[#818CF8] hover:text-[#6366F1] hover:underline"
                    >
                      {client.account_manager}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    {client.account_size != null
                      ? <span className="text-gray-100">฿{client.account_size.toLocaleString('en-US')}</span>
                      : <span className="text-gray-500">Not set</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <PriorityBadge priority={client.priority} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <TrendDots statuses={client.recent_statuses} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={client.current_status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filter !== 'all' && (
        <p className="text-xs text-gray-500 mt-2">
          Showing clients with <strong className="text-gray-300">{filter}</strong> status. Click again to clear filter.
        </p>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#27272A] rounded-xl shadow-xl border border-[#3F3F46] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="text-base font-semibold text-gray-100">Add Client</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name <span className="text-gray-500">*</span></label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder-gray-500"
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Manager <span className="text-gray-500">*</span></label>
                  <input
                    value={formAm}
                    onChange={(e) => setFormAm(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder-gray-500"
                    placeholder="e.g. Tan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Package <span className="text-gray-500">*</span></label>
                  <input
                    value={formPkg}
                    onChange={(e) => setFormPkg(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder-gray-500"
                    placeholder="e.g. Basic, Premium, Enterprise"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Size (THB) <span className="text-gray-500 font-normal">(optional)</span></label>
                  <input
                    type="number"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder-gray-500"
                    placeholder="e.g. 500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Industry <span className="text-gray-500 font-normal">(optional)</span></label>
                  <input
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder-gray-500"
                    placeholder="e.g. Technology, Healthcare"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority <span className="text-gray-500 font-normal">(optional)</span></label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contract Start <span className="text-gray-500">*</span></label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contract Length <span className="text-gray-500">*</span></label>
                  <input
                    value={formLen}
                    onChange={(e) => setFormLen(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    placeholder="e.g. 6 months"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Details / Notes <span className="text-gray-500 font-normal">(optional)</span></label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none placeholder-gray-500"
                  placeholder="e.g. Special pricing terms, key contacts..."
                />
              </div>
              {formError && (
                <p className="text-sm text-[#EF4444] border border-[#EF4444]/30 border-l-4 border-l-[#EF4444] bg-[#27272A] px-3 py-2 rounded-lg">{formError}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#1F1F23] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-[#4F46E5] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#4338CA] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {formLoading ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
