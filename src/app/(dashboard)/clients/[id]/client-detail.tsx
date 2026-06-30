'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logWeeklyStatus, deleteStatus } from '@/app/actions/status'
import { markClientLost, reactivateClient } from '@/app/actions/client-flags'
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
          ? 'bg-[#ECFDF5] text-[#059669]'
          : status === 'Yellow'
            ? 'bg-[#FFFBEB] text-[#D97706]'
            : 'bg-[#FEF2F2] text-[#DC2626]'
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        &larr; Back to clients
      </Link>

      <div className={`rounded-xl border p-4 mb-6 ${lostInfo?.lost_at && !lostInfo?.reactivated_at ? 'bg-white border-gray-200 opacity-70' : 'bg-white border-gray-200'}`}>
        <h1 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
          {client.name}
          {lostInfo?.lost_at && !lostInfo?.reactivated_at && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
              Lost
            </span>
          )}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Account Manager
            </div>
            <div className="text-sm text-gray-900">
              {client.account_manager}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Package
            </div>
            <div className="text-sm text-gray-900">{client.package}</div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Account Size
            </div>
            <div className="text-sm text-gray-900">
              {meta.account_size != null ? `\u0E3F${meta.account_size.toLocaleString('en-US')}` : <span className="text-gray-400">Not set</span>}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Industry
            </div>
            <div className="text-sm text-gray-900">
              {meta.industry || '\u2014'}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Contract Start
            </div>
            <div className="text-sm text-gray-900">{contractStart}</div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Contract Length
            </div>
            <div className="text-sm text-gray-900">
              {client.contract_length}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Priority
            </div>
            <div className="text-sm text-gray-900">
              {meta.priority || 'Medium'}
            </div>
          </div>
        </div>

        {meta.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Details / Notes
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{meta.notes}</p>
          </div>
        )}
      </div>

      {lostInfo?.lost_at && !lostInfo.reactivated_at && (
        <div className="bg-white border border-gray-200 border-l-4 border-l-[#DC2626] rounded-xl p-4 mb-6 flex items-center gap-1">
          <span className="text-[#DC2626] text-xl">&#9888;</span>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">Marked as Lost</div>
            <div className="text-[13px] text-gray-500">
              {lostInfo.reason ? `Reason: ${lostInfo.reason}` : 'No reason provided'}
            </div>
          </div>
        </div>
      )}

      {lostInfo?.reactivated_at && (
        <div className="bg-white border border-gray-200 border-l-4 border-l-[#059669] rounded-xl p-4 mb-6 flex items-center gap-1">
          <span className="text-[#059669] text-xl">&#10003;</span>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">Reactivated</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
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
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Comment (optional)
            </label>
            {lastWeekLog?.comment && (
              <div className="mb-2 p-2 rounded-lg bg-[#FAFAFA] border border-gray-200 text-[13px] text-gray-500">
                <span className="font-medium text-gray-600">Last week:</span> {lastWeekLog.comment}
              </div>
            )}
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] resize-none"
              placeholder="Add any notes about this week's status..."
            />
          </div>

          {message && (
            <p className="text-sm text-[#059669] bg-white border border-[#059669]/30 border-l-4 border-l-[#059669] px-3 py-2 rounded-lg">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-[#DC2626] bg-white border border-[#DC2626]/30 border-l-4 border-l-[#DC2626] px-3 py-2 rounded-lg">
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

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Weekly History
        </h2>

        {statusLogs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No status logs yet
          </p>
        ) : (
          <div className="space-y-3">
            {statusLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white"
              >
                <div className="flex-shrink-0 pt-0.5">
                  <StatusIndicator status={log.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-gray-400 font-medium">
                    Week of {formatDate(log.week_date)}
                  </div>
                  {log.comment && (
                    <p className="text-sm text-gray-700 mt-1">{log.comment}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-[13px] text-gray-400 hover:text-[#DC2626] transition-colors cursor-pointer flex-shrink-0"
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
        <div className="border-t border-gray-200 pt-4 mt-2">
          <details className="group">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 select-none">
              Advanced
            </summary>
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                Mark as Lost
              </h2>
              <p className="text-[13px] text-gray-400 mb-3">
                If this client has churned or been lost, mark them here.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  placeholder="Reason for losing client..."
                />
                <input
                  type="date"
                  value={lostDate}
                  onChange={(e) => setLostDate(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <button
                  onClick={handleMarkLost}
                  className="px-3 py-1.5 border border-[#DC2626]/40 text-[#DC2626] rounded text-sm font-medium hover:bg-[#DC2626]/5 transition-colors cursor-pointer"
                >
                  Mark as Lost
                </button>
              </div>
              {lostMessage && (
                <p className="text-sm text-[#059669] mt-2">{lostMessage}</p>
              )}
              {lostError && (
                <p className="text-sm text-[#DC2626] mt-2">{lostError}</p>
              )}
            </div>
          </details>
        </div>
      ) : (
        <div className="border-t border-gray-200 pt-4 mt-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-400">
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
              className="text-sm text-[#4F46E5] hover:text-[#4338CA] hover:underline cursor-pointer"
            >
              Reactivate
            </button>
          </div>
          {lostMessage && (
            <p className="text-sm text-[#059669] mt-2">{lostMessage}</p>
          )}
          {lostError && (
            <p className="text-sm text-[#DC2626] mt-2">{lostError}</p>
          )}
        </div>
      )}
    </div>
  )
}
