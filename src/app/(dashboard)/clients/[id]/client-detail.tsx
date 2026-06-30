'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logWeeklyStatus, deleteStatus } from '@/app/actions/status'
import { markClientLost, reactivateClient } from '@/app/actions/client-flags'
import { deleteClient } from '@/app/actions/clients'
import type { Client, WeeklyStatus, StatusColor, ClientMeta } from '@/lib/types'

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusIndicator({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Green: 'bg-emerald-500',
    Yellow: 'bg-amber-400',
    Red: 'bg-red-500',
  }

  return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          status === 'Green'
            ? 'bg-[#064E3B] text-[#34D399]'
            : status === 'Yellow'
              ? 'bg-[#422006] text-[#FBBF24]'
              : 'bg-[#450A0A] text-[#EF4444]'
        }`}
      >
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {status}
    </span>
  )
}

export function ClientDetail({
  client,
  statusLogs,
  lostInfo,
  meta = {},
}: {
  client: Client
  statusLogs: WeeklyStatus[]
  lostInfo: { reason: string; lost_at: string | null; reactivated_at: string | null } | null
  meta?: ClientMeta
}) {
  const router = useRouter()
  const [status, setStatus] = useState<StatusColor>('Green')
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [lostDate, setLostDate] = useState(new Date().toISOString().split('T')[0])
  const [lostMessage, setLostMessage] = useState('')
  const [lostError, setLostError] = useState('')

  const thisWeekMonday = getMonday(new Date())
  const existingThisWeek = statusLogs.find((s) => s.week_date === thisWeekMonday)

  const lastWeek = new Date(thisWeekMonday + 'T00:00:00')
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastWeekMonday = lastWeek.toISOString().split('T')[0]
  const lastWeekLog = statusLogs.find((s) => s.week_date === lastWeekMonday)

  const contractStart = formatDate(client.contract_start_date)

  useEffect(() => {
    if (existingThisWeek) {
      setStatus(existingThisWeek.status as StatusColor)
      setComment(existingThisWeek.comment || '')
    } else {
      setStatus('Green')
      setComment('')
    }
  }, [existingThisWeek])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await logWeeklyStatus(client.id, status, comment, thisWeekMonday)
      setMessage('Status logged successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log status')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this history entry? This is a permanent record and cannot be recovered.')) return
    try {
      await deleteStatus(id, client.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  async function handleMarkLost() {
    if (!lostReason.trim()) return
    if (!confirm('Are you sure you want to mark this client as lost? This action should only be used when the client relationship has genuinely ended.')) return
    try {
      await markClientLost(client.id, lostReason.trim(), lostDate)
      setLostReason('')
      setLostMessage('Client marked as lost')
    } catch (err) {
      setLostError(err instanceof Error ? err.message : 'Failed to mark as lost')
    }
  }

  async function handleDeleteClient() {
    if (!confirm(`Are you sure you want to permanently delete ${client.name}? This will remove all their data including weekly history, and cannot be undone.`)) return
    try {
      await deleteClient(client.id)
      router.push('/clients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-100 mb-4"
      >
        &larr; Back to clients
      </Link>

      <div className={`rounded-xl border p-4 mb-6 ${lostInfo?.lost_at && !lostInfo?.reactivated_at ? 'bg-[#27272A] border-[#3F3F46] opacity-70' : 'bg-[#27272A] border-[#3F3F46]'}`}>
        <h1 className="text-2xl font-semibold text-gray-100 mb-4 flex items-center gap-3">
          {client.name}
          {lostInfo?.lost_at && !lostInfo?.reactivated_at && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1F1F23] text-gray-400">
              Lost
            </span>
          )}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Account Manager
            </div>
            <div className="text-sm text-gray-100">
              {client.account_manager}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Package
            </div>
            <div className="text-sm text-gray-100">{client.package}</div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Account Size
            </div>
            <div className="text-sm text-gray-100">
              {meta.account_size != null ? `\u0E3F${meta.account_size.toLocaleString('en-US')}` : <span className="text-gray-500">Not set</span>}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Industry
            </div>
            <div className="text-sm text-gray-100">
              {meta.industry || '\u2014'}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Contract Start
            </div>
            <div className="text-sm text-gray-100">{contractStart}</div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Contract Length
            </div>
            <div className="text-sm text-gray-100">
              {client.contract_length}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Priority
            </div>
            <div className="text-sm text-gray-100">
              {meta.priority || 'Medium'}
            </div>
          </div>
        </div>

        {meta.notes && (
          <div className="mt-4 pt-4 border-t border-[#3F3F46]">
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Details / Notes
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{meta.notes}</p>
          </div>
        )}
      </div>

      {lostInfo?.lost_at && !lostInfo.reactivated_at && (
        <div className="bg-[#27272A] border border-[#3F3F46] border-l-4 border-l-[#DC2626] rounded-xl p-4 mb-6 flex items-center gap-1">
          <span className="text-[#DC2626] text-xl">&#9888;</span>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-100">Marked as Lost</div>
            <div className="text-[13px] text-gray-400">
              {lostInfo.reason ? `Reason: ${lostInfo.reason}` : 'No reason provided'}
            </div>
          </div>
        </div>
      )}

      {lostInfo?.reactivated_at && (
        <div className="bg-[#27272A] border border-[#3F3F46] border-l-4 border-l-[#059669] rounded-xl p-4 mb-6 flex items-center gap-1">
          <span className="text-[#059669] text-xl">&#10003;</span>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-100">Reactivated</div>
          </div>
        </div>
      )}

      <div className="bg-[#27272A] rounded-xl border border-[#3F3F46] p-4 mb-6">
        <h2 className="text-base font-semibold text-gray-100 mb-4">
          {existingThisWeek ? "Update This Week's Status" : "Log This Week's Status"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            {(['Green', 'Yellow', 'Red'] as StatusColor[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                  status === s
                    ? s === 'Green'
                      ? 'bg-[#059669] text-white border-[#059669]'
                      : s === 'Yellow'
                        ? 'bg-[#D97706] text-white border-[#D97706]'
                        : 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-[#27272A] border-[#52525B] text-gray-400 hover:border-gray-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Comment (optional)
            </label>
            {lastWeekLog?.comment && (
              <div className="mb-2 p-2 rounded-lg bg-[#1F1F23] border border-[#3F3F46] text-[13px] text-gray-400">
                <span className="font-medium text-gray-300">Last week:</span> {lastWeekLog.comment}
              </div>
            )}
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-[#18181B] border border-[#52525B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none placeholder-gray-500"
              placeholder="Add any notes about this week's status..."
            />
          </div>

          {message && (
            <p className="text-sm text-[#34D399] bg-[#27272A] border border-[#34D399]/30 border-l-4 border-l-[#34D399] px-3 py-2 rounded-lg">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-[#EF4444] bg-[#27272A] border border-[#EF4444]/30 border-l-4 border-l-[#EF4444] px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#4F46E5] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#4338CA] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Saving...' : existingThisWeek ? 'Update Status' : 'Log Status'}
          </button>
        </form>
      </div>

      <div className="bg-[#27272A] rounded-xl border border-[#3F3F46] p-4 mb-6">
        <h2 className="text-base font-semibold text-gray-100 mb-4">
          Weekly History
        </h2>

        {statusLogs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No status logs yet
          </p>
        ) : (
          <div className="space-y-3">
            {statusLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-[#3F3F46]/50 bg-[#27272A]"
              >
                <div className="flex-shrink-0 pt-0.5">
                  <StatusIndicator status={log.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-gray-500 font-medium">
                    Week of {formatDate(log.week_date)}
                  </div>
                  {log.comment && (
                    <p className="text-sm text-gray-300 mt-1">{log.comment}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-[13px] text-gray-500 hover:text-[#EF4444] transition-colors cursor-pointer flex-shrink-0"
                  title="Delete entry"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!lostInfo?.lost_at || lostInfo.reactivated_at ? (
        <div className="border-t border-[#3F3F46] pt-4 mt-2">
          <details className="group">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300 select-none">
              Advanced
            </summary>
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                Mark as Lost
              </h2>
              <p className="text-[13px] text-gray-500 mb-3">
                If this client has churned or been lost, mark them here.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-[#18181B] border border-[#52525B] rounded text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder-gray-500"
                  placeholder="Reason for losing client..."
                />
                <input
                  type="date"
                  value={lostDate}
                  onChange={(e) => setLostDate(e.target.value)}
                  className="px-2 py-1.5 bg-[#18181B] border border-[#52525B] rounded text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <button
                  onClick={handleMarkLost}
                  className="px-3 py-1.5 border border-[#EF4444]/40 text-[#EF4444] rounded text-sm font-medium hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                >
                  Mark as Lost
                </button>
              </div>
              {lostMessage && (
                <p className="text-sm text-[#34D399] mt-2">{lostMessage}</p>
              )}
              {lostError && (
                <p className="text-sm text-[#EF4444] mt-2">{lostError}</p>
              )}
            </div>
          </details>
        </div>
      ) : (
        <div className="border-t border-[#3F3F46] pt-4 mt-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-500">
              This client was marked as lost.
            </p>
            <button
              onClick={async () => {
                if (!confirm('Reactivate this client?')) return
                try {
                  await reactivateClient(client.id)
                  setLostMessage('Client reactivated')
                } catch (err) {
                  setLostError(err instanceof Error ? err.message : 'Failed to reactivate')
                }
              }}
              className="text-sm text-[#818CF8] hover:text-[#6366F1] hover:underline cursor-pointer"
            >
              Reactivate
            </button>
          </div>
          {lostMessage && (
            <p className="text-sm text-[#34D399] mt-2">{lostMessage}</p>
          )}
          {lostError && (
            <p className="text-sm text-[#EF4444] mt-2">{lostError}</p>
          )}
        </div>
      )}

      <div className="border-t border-[#3F3F46] pt-6 mt-6">
        <button
          onClick={handleDeleteClient}
          className="text-sm text-[#EF4444] border border-[#EF4444]/20 px-3 py-1.5 rounded hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
        >
          Delete Client
        </button>
      </div>
    </div>
  )
}
