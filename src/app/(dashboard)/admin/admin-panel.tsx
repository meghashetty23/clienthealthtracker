'use client'

import { useState } from 'react'
import { createUser, updateUser, deleteUser, updateSetting } from '@/app/actions/admin'
import type { Profile, AppSetting, DropAlert, StaleAlert, StatusLogEntry, LostClientInfo, MissedSignal } from '@/lib/types'

export function AdminPanel({
  profiles,
  settings,
  dropAlerts = [],
  staleAlerts = [],
  statusLog = [],
  lostClients = [],
  missedSignals = [],
}: {
  profiles: Profile[]
  settings: AppSetting[]
  dropAlerts?: DropAlert[]
  staleAlerts?: StaleAlert[]
  statusLog?: StatusLogEntry[]
  lostClients?: LostClientInfo[]
  missedSignals?: MissedSignal[]
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('viewer')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [logAmFilter, setLogAmFilter] = useState('all')
  const [logStartDate, setLogStartDate] = useState('')
  const [logEndDate, setLogEndDate] = useState('')

  const updateFreqSetting = settings.find((s) => s.key === 'update_frequency')
  const [freqValue, setFreqValue] = useState(updateFreqSetting?.value || 'weekly')
  const [freqMessage, setFreqMessage] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      await createUser(name, email, password, role)
      setName('')
      setEmail('')
      setPassword('')
      setRole('viewer')
      setMessage(`User "${name}" created successfully`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  async function handleUpdate(id: string) {
    setMessage('')
    setError('')

    try {
      await updateUser(id, editName, editRole)
      setEditingId(null)
      setMessage('User updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    setMessage('')
    setError('')

    try {
      await deleteUser(id)
      setMessage(`User "${name}" deleted`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  async function handleFreqSave() {
    setFreqMessage('')
    try {
      await updateSetting('update_frequency', freqValue)
      setFreqMessage('Update frequency saved!')
    } catch (err) {
      setFreqMessage(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>

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

      {(dropAlerts.length > 0 || staleAlerts.length > 0) && (
        <section className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-[#DC2626] p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Alerts</h2>
          <p className="text-[13px] text-gray-500 mb-4">
            Clients whose status dropped 2 levels or have not been updated in 7+ days.
          </p>
          <div className="space-y-3">
            {dropAlerts.map((alert, i) => (
              <div key={`drop-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 border-l-4 border-l-[#DC2626]">
                <span className="text-[#DC2626] text-lg leading-none">&#9888;</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{alert.client_name}</div>
                  <div className="text-[13px] text-gray-500">
                    {alert.account_manager} &middot; {alert.drop_description}
                  </div>
                </div>
                <span className="text-[13px] text-gray-400 whitespace-nowrap">{alert.week_date}</span>
              </div>
            ))}
            {staleAlerts.map((alert, i) => (
              <div key={`stale-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 border-l-4 border-l-[#D97706]">
                <span className="text-[#D97706] text-lg leading-none">&#9201;</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{alert.client_name}</div>
                  <div className="text-[13px] text-gray-500">
                    {alert.account_manager} &middot; Last update: {alert.last_week_date}
                  </div>
                </div>
                <span className="text-[13px] text-gray-500 font-medium whitespace-nowrap">{alert.days_since_update}d ago</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {lostClients.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-gray-400 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Lost / Churned Clients
          </h2>
          <div className="space-y-2">
            {lostClients.map((lc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
                <span className="text-gray-400 text-lg">&#10005;</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{lc.client_name}</div>
                  <div className="text-[13px] text-gray-500">
                    {lc.account_manager} &middot; {lc.reason || 'No reason'}
                  </div>
                </div>
                <span className="text-[13px] text-gray-400 whitespace-nowrap">{lc.lost_at}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {missedSignals.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-[#D97706] p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Missed Signals</h2>
          <p className="text-[13px] text-gray-500 mb-4">
            Clients stuck on Red with no update in 14+ days (not marked as lost).
          </p>
          <div className="space-y-2">
            {missedSignals.map((ms, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 border-l-4 border-l-[#D97706]">
                <span className="text-[#D97706] text-lg">&#9888;</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{ms.client_name}</div>
                  <div className="text-[13px] text-gray-500">
                    {ms.account_manager} &middot; Last update: {ms.last_week_date}
                  </div>
                </div>
                <span className="text-[13px] text-gray-500 font-medium whitespace-nowrap">{ms.days_since_update}d</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Users</h2>

        <div className="space-y-3 mb-6">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
            >
              {editingId === p.id ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Name"
                  />
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="account_manager">Account Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleUpdate(p.id)}
                    className="text-xs px-2 py-1 bg-[#4F46E5] text-white rounded hover:bg-[#4338CA] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">
                      {p.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(p.id)
                        setEditName(p.name)
                        setEditRole(p.role)
                      }}
                      className="text-xs text-[#4F46E5] hover:text-[#4338CA] cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-xs text-gray-500 hover:text-[#DC2626] cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add User</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            placeholder="Full name"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            placeholder="Email address"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            placeholder="Temporary password"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="admin">Admin</option>
            <option value="account_manager">Account Manager</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            className="sm:col-span-2 bg-[#4F46E5] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#4338CA] transition-colors cursor-pointer"
          >
            Add User
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Preferences</h2>

        <div className="flex items-center gap-3">
          <label htmlFor="frequency" className="text-sm font-medium text-gray-700">
            Expected update frequency:
          </label>
          <select
            id="frequency"
            value={freqValue}
            onChange={(e) => setFreqValue(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={handleFreqSave}
            className="bg-[#4F46E5] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#4338CA] transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
        {freqMessage && (
          <p className="text-sm text-[#059669] bg-white border border-[#059669]/30 border-l-4 border-l-[#059669] px-3 py-2 rounded-lg mt-2">{freqMessage}</p>
        )}
        <p className="text-[13px] text-gray-400 mt-2">
          This is a stored preference for tracking purposes. Notifications are not yet implemented.
        </p>
      </section>
      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Status History Log</h2>

        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={logAmFilter}
            onChange={(e) => setLogAmFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All Account Managers</option>
            {[...new Set(statusLog.map((e) => e.account_manager))].sort().map((am) => (
              <option key={am} value={am}>{am}</option>
            ))}
          </select>
          <input
            type="date"
            value={logStartDate}
            onChange={(e) => setLogStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            placeholder="Start date"
          />
          <input
            type="date"
            value={logEndDate}
            onChange={(e) => setLogEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            placeholder="End date"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FAFAFA]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Manager</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Week</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment</th>
              </tr>
            </thead>
            <tbody>
              {statusLog
                .filter((e) => logAmFilter === 'all' || e.account_manager === logAmFilter)
                .filter((e) => !logStartDate || e.week_date >= logStartDate)
                .filter((e) => !logEndDate || e.week_date <= logEndDate)
                .map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 text-gray-900">{entry.client_name}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.account_manager}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          entry.status === 'Green'
                            ? 'bg-[#ECFDF5] text-[#059669] ring-1 ring-inset ring-[#059669]/20'
                            : entry.status === 'Yellow'
                            ? 'bg-[#FFFBEB] text-[#D97706] ring-1 ring-inset ring-[#D97706]/20'
                            : 'bg-[#FEF2F2] text-[#DC2626] ring-1 ring-inset ring-[#DC2626]/20'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(entry.week_date)}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{entry.comment || '—'}</td>
                  </tr>
                ))}
              {statusLog.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No status logs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}
