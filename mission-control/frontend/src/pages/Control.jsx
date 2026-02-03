import { useState, useEffect, useCallback } from 'react'
import { cronApi } from '../api'

const API = '/api'
const json = r => r.json()
function api(url, opts = {}) {
  const token = localStorage.getItem('mc_token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...opts.headers }
  return fetch(API + url, { ...opts, headers }).then(json)
}

function fmtBytes(b) {
  if (b >= 1e9) return `${(b/1e9).toFixed(1)} GB`
  return `${(b/1e6).toFixed(0)} MB`
}
function fmtUptime(s) {
  const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
function timeAgo(ts) {
  if (!ts) return 'never'
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

const MODELS = [
  { id: 'anthropic/claude-opus-4-5', label: 'Opus 4.5', cost: '$$$' },
  { id: 'anthropic/claude-sonnet-4-20250514', label: 'Sonnet 4', cost: '$$' },
  { id: 'anthropic/claude-haiku-4-20250514', label: 'Haiku 4', cost: '$' },
]

// ─── Metric Card ──────────────────────────────────
function Metric({ label, value, sub, color }) {
  return (
    <div className="bg-surface border border-card rounded-lg p-4">
      <div className={`text-2xl font-bold ${color || 'text-text'}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted/70 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── System Status ────────────────────────────────
function SystemStatus({ status }) {
  if (!status) return <div className="text-muted text-center py-8">Loading...</div>
  const mem = status.memory || {}
  const memColor = mem.pct > 85 ? 'text-red-400' : mem.pct > 70 ? 'text-yellow-400' : 'text-green-400'
  const ips = Object.entries(status.network || {}).map(([k,v]) => `${k}: ${v}`).join(' | ')

  const modelShort = (status.model || '').replace('anthropic/','').replace('claude-','')
  const ctx = status.session?.context || '?'
  const ver = status.session?.version || '?'

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">🖥️ System</h3>
        <span className="text-xs text-muted font-mono">Clawdbot {ver}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric label="System Uptime" value={fmtUptime(status.systemUptime)} sub={status.hostname} />
        <Metric label="RAM Usage" value={`${mem.pct}%`} color={memColor}
          sub={`${fmtBytes(mem.used)} / ${fmtBytes(mem.total)}`} />
        <Metric label="Disk" value={status.disk?.pct || '?'} sub={`${status.disk?.used || '?'} / ${status.disk?.total || '?'}`} />
        <Metric label="Model" value={modelShort} sub={`Context: ${ctx}`} color="text-highlight" />
        <Metric label="CPU Load" value={status.cpu?.load?.[0]?.toFixed(2) || '?'}
          sub={`${status.cpu?.cores || '?'} cores`} />
      </div>
      <div className="mt-2 text-xs text-muted">{ips}</div>
    </div>
  )
}

// ─── Heartbeat Status ─────────────────────────────
function HeartbeatStatus({ status, onPatch }) {
  const hb = status?.heartbeat || {}
  const hbState = status?.heartbeatState || {}
  const enabled = hb.enabled
  const [editing, setEditing] = useState(false)
  const [freq, setFreq] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  useEffect(() => {
    if (hb.every) setFreq(hb.every.replace('min','').replace('m',''))
    if (hb.activeHours?.start) setStart(hb.activeHours.start)
    if (hb.activeHours?.end) setEnd(hb.activeHours.end)
  }, [status])

  const save = async () => {
    const patch = { agents: { defaults: { heartbeat: {
      every: `${freq}min`,
      activeHours: { start, end }
    }}}}
    await onPatch(patch)
    setEditing(false)
  }

  // Last checks from heartbeat-state.json
  const lastChecks = hbState.lastChecks || {}
  const lastReview = hbState.lastDailyReview

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">💓 Heartbeat</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {enabled ? 'Active' : 'Off'}
          </span>
        </div>
      </div>

      <div className="bg-surface border border-card rounded-lg p-4">
        {!editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted">Frequency</div>
                <div className="text-lg font-semibold text-text">{hb.every || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Active Hours</div>
                <div className="text-lg font-semibold text-text">
                  {hb.activeHours ? `${hb.activeHours.start}–${hb.activeHours.end}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted">Channels</div>
                <div className="text-lg font-semibold text-text">
                  {(status?.gateway?.channels || []).join(', ') || '—'}
                </div>
              </div>
            </div>

            {/* Last checks */}
            {Object.keys(lastChecks).length > 0 && (
              <div className="border-t border-card pt-3">
                <div className="text-xs text-muted mb-2">Last checks</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(lastChecks).map(([k, v]) => (
                    <span key={k} className="text-xs bg-card px-2 py-1 rounded">
                      {k}: <span className="text-text">{v ? timeAgo(v * 1000) : 'never'}</span>
                    </span>
                  ))}
                  {lastReview && (
                    <span className="text-xs bg-card px-2 py-1 rounded">
                      daily review: <span className="text-text">{lastReview}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setEditing(true)}
              className="text-xs text-highlight hover:underline">✏️ Edit schedule</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1">Frequency (min)</label>
                <input type="number" value={freq} onChange={e => setFreq(e.target.value)} min="1" max="120"
                  className="w-full bg-card border border-accent rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Start</label>
                <input type="time" value={start} onChange={e => setStart(e.target.value)}
                  className="w-full bg-card border border-accent rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">End</label>
                <input type="time" value={end} onChange={e => setEnd(e.target.value)}
                  className="w-full bg-card border border-accent rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save}
                className="bg-highlight text-white px-4 py-1.5 rounded text-xs font-medium">Save</button>
              <button onClick={() => setEditing(false)}
                className="text-muted hover:text-text px-3 py-1.5 text-xs">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Model Selector ───────────────────────────────
function ModelSelector({ status, onPatch }) {
  const current = status?.model || ''
  const [saving, setSaving] = useState(false)

  const change = async (modelId) => {
    setSaving(true)
    await onPatch({ agents: { defaults: { model: modelId } } })
    setSaving(false)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">🧠 Model</h3>
      <div className="grid grid-cols-3 gap-3">
        {MODELS.map(m => {
          const active = current === m.id
          return (
            <button key={m.id} onClick={() => !active && change(m.id)} disabled={saving}
              className={`border rounded-lg p-4 text-left transition-all ${
                active ? 'border-highlight bg-highlight/10' : 'border-card bg-surface hover:border-accent'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text">{m.label}</span>
                <span className="text-xs text-muted">{m.cost}</span>
              </div>
              {active && <div className="text-[10px] text-highlight mt-1">● Active</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Pendientes ───────────────────────────────────
function Pendientes() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ total: 0, done: 0 })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const data = await api('/pendientes')
      setItems(data.items || [])
      setStats({ total: data.total, done: data.done })
    } catch (e) { console.error(e) }
  }

  const toggle = async (item) => {
    const newDone = !item.done
    // Optimistic update
    setItems(prev => prev.map(i => i.line === item.line ? { ...i, done: newDone } : i))
    setStats(prev => ({ ...prev, done: prev.done + (newDone ? 1 : -1) }))
    try {
      await api(`/pendientes/${item.line}`, { method: 'PATCH', body: JSON.stringify({ done: newDone }) })
    } catch (e) { load() }
  }

  if (items.length === 0) return null

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">📝 Pendientes</h3>
        <span className="text-xs text-muted">{stats.done}/{stats.total} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-card rounded-full overflow-hidden mb-3">
        <div className="h-full bg-highlight rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="bg-surface border border-card rounded-lg divide-y divide-card max-h-80 overflow-auto">
        {items.map(item => (
          <label key={item.line}
            className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-card/50 transition-all ${item.done ? 'opacity-50' : ''}`}>
            <input type="checkbox" checked={item.done} onChange={() => toggle(item)}
              className="mt-0.5 w-4 h-4 rounded border-accent bg-card text-highlight focus:ring-highlight shrink-0" />
            <span className={`text-sm ${item.done ? 'line-through text-muted' : 'text-text'}`}>{item.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Cron Jobs ────────────────────────────────────
function CronJobs() {
  const [jobs, setJobs] = useState([])
  const [running, setRunning] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    try {
      const data = await cronApi.list()
      setJobs(data.jobs || [])
    } catch (e) { console.error(e) }
  }

  const toggleJob = async (job) => {
    try {
      await api(`/cron/${job.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !job.enabled }) })
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, enabled: !j.enabled } : j))
    } catch (e) { alert('Error: ' + e.message) }
  }

  const runJob = async (job) => {
    setRunning(job.id)
    try {
      await api(`/cron/${job.id}/run`, { method: 'POST' })
    } catch (e) { alert('Error: ' + e.message) }
    setRunning(null)
  }

  if (jobs.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">⏰ Cron Jobs</h3>
      <div className="space-y-2">
        {jobs.map(job => (
          <div key={job.id} className="bg-surface border border-card rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleJob(job)}
                  className={`w-10 h-5 rounded-full transition-all relative ${job.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${job.enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
                <div>
                  <span className="text-sm font-medium text-text">{job.name || (job.id||'').slice(0,12)}</span>
                  <span className="text-xs text-muted bg-card px-1.5 py-0.5 rounded font-mono ml-2">
                    {job.schedule?.expr || '?'}
                  </span>
                </div>
              </div>
              <button onClick={() => runJob(job)} disabled={running === job.id}
                className="text-xs text-highlight hover:underline disabled:opacity-50">
                {running === job.id ? '⏳' : '▶ Run now'}
              </button>
            </div>
            {job.payload?.text && (
              <p className="text-xs text-muted mt-2 pl-13 truncate">{job.payload.text.slice(0, 100)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Control Panel ────────────────────────────────
export default function Control() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api('/status')
      setStatus(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])
  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const patchConfig = async (patch) => {
    try {
      await api('/gateway/config', { method: 'PATCH', body: JSON.stringify(patch) })
      // Reload status after config change (gateway restarts)
      setTimeout(load, 3000)
    } catch (e) { alert('Error: ' + e.message) }
  }

  if (loading) return <div className="flex items-center justify-center h-full text-muted">Loading...</div>

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">🎛️ Control Panel</h2>
        <button onClick={load} className="text-xs text-highlight hover:underline">↻ Refresh</button>
      </div>

      <SystemStatus status={status} />
      <HeartbeatStatus status={status} onPatch={patchConfig} />
      <ModelSelector status={status} onPatch={patchConfig} />
      <Pendientes />
      <CronJobs />
    </div>
  )
}
