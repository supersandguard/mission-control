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
    <div className="bg-surface border border-card rounded-lg p-3 md:p-4">
      <div className={`text-lg md:text-2xl font-bold ${color || 'text-text'}`}>{value}</div>
      <div className="text-[10px] md:text-xs text-muted mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-muted/70">{sub}</div>}
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs md:text-sm font-semibold text-muted uppercase tracking-wider">🖥️ System</h3>
        <span className="text-[10px] text-muted font-mono">v{ver}</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
        <Metric label="Uptime" value={fmtUptime(status.systemUptime)} sub={status.hostname} />
        <Metric label="RAM" value={`${mem.pct}%`} color={memColor}
          sub={`${fmtBytes(mem.used)}/${fmtBytes(mem.total)}`} />
        <Metric label="Model" value={modelShort} sub={`Ctx: ${ctx}`} color="text-highlight" />
        <Metric label="Disk" value={status.disk?.pct || '?'} sub={`${status.disk?.used || '?'}/${status.disk?.total || '?'}`} />
        <Metric label="CPU" value={status.cpu?.load?.[0]?.toFixed(2) || '?'}
          sub={`${status.cpu?.cores || '?'} cores`} />
      </div>
      <div className="mt-1 text-[10px] text-muted hidden md:block">{ips}</div>
    </div>
  )
}

// ─── Heartbeat Status ─────────────────────────────
function HeartbeatStatus({ status, onPatch }) {
  const hb = status?.heartbeat || {}
  const enabled = hb.enabled
  const [editing, setEditing] = useState(false)
  const [freq, setFreq] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  // Checks system
  const [checks, setChecks] = useState([])
  const [editingCheck, setEditingCheck] = useState(null)
  const [addingCheck, setAddingCheck] = useState(false)
  const [newCheck, setNewCheck] = useState({ id: '', name: '', description: '', frequencyHours: 4, priority: 'medium' })

  useEffect(() => {
    if (hb.every) setFreq(hb.every.replace('min','').replace('m',''))
    if (hb.activeHours?.start) setStart(hb.activeHours.start)
    if (hb.activeHours?.end) setEnd(hb.activeHours.end)
  }, [status])

  useEffect(() => { loadChecks() }, [])

  const loadChecks = async () => {
    try {
      const data = await api('/heartbeat/checks')
      setChecks(data.checks || [])
    } catch (e) { console.error(e) }
  }

  const saveSchedule = async () => {
    const patch = { agents: { defaults: { heartbeat: {
      every: `${freq}min`,
      activeHours: { start, end }
    }}}}
    await onPatch(patch)
    setEditing(false)
  }

  const toggleCheck = async (check) => {
    const updated = !check.enabled
    setChecks(prev => prev.map(c => c.id === check.id ? { ...c, enabled: updated } : c))
    try {
      await api(`/heartbeat/checks/${check.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: updated }) })
    } catch (e) { loadChecks() }
  }

  const saveCheck = async (check) => {
    try {
      await api(`/heartbeat/checks/${check.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: check.description, frequencyHours: check.frequencyHours, priority: check.priority, fixedTime: check.fixedTime || undefined })
      })
      setEditingCheck(null)
      loadChecks()
    } catch (e) { alert('Error: ' + e.message) }
  }

  const addCheck = async () => {
    if (!newCheck.id || !newCheck.name) return
    try {
      await api('/heartbeat/checks', { method: 'POST', body: JSON.stringify({ ...newCheck, enabled: true }) })
      setAddingCheck(false)
      setNewCheck({ id: '', name: '', description: '', frequencyHours: 4, priority: 'medium' })
      loadChecks()
    } catch (e) { alert('Error: ' + e.message) }
  }

  const deleteCheck = async (id) => {
    if (!confirm('Delete this check?')) return
    try {
      await api(`/heartbeat/checks/${id}`, { method: 'DELETE' })
      loadChecks()
    } catch (e) { alert('Error: ' + e.message) }
  }

  const priorityColor = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-muted' }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">💓 Heartbeat</h3>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {enabled ? 'Active' : 'Off'}
        </span>
      </div>

      {/* Schedule */}
      <div className="bg-surface border border-card rounded-lg p-3 md:p-4 mb-3">
        {!editing ? (
          <div className="flex items-center justify-between">
            <div className="flex gap-4 md:gap-6">
              <div><span className="text-[10px] md:text-xs text-muted">Every</span><div className="text-sm md:text-lg font-semibold text-text">{hb.every || '—'}</div></div>
              <div><span className="text-[10px] md:text-xs text-muted">Hours</span><div className="text-sm md:text-lg font-semibold text-text">{hb.activeHours ? `${hb.activeHours.start}–${hb.activeHours.end}` : '—'}</div></div>
              <div className="hidden md:block"><span className="text-xs text-muted">Channels</span><div className="text-lg font-semibold text-text">{(status?.gateway?.channels || []).join(', ') || '—'}</div></div>
            </div>
            <button onClick={() => setEditing(true)} className="text-xs text-highlight hover:underline">✏️</button>
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
              <button onClick={saveSchedule} className="bg-highlight text-white px-4 py-1.5 rounded text-xs font-medium">Save</button>
              <button onClick={() => setEditing(false)} className="text-muted hover:text-text px-3 py-1.5 text-xs">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Checks */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted">Checks — what I monitor each heartbeat</span>
        <button onClick={() => setAddingCheck(true)} className="text-xs text-highlight hover:underline">+ Add check</button>
      </div>

      <div className="space-y-2">
        {checks.map(check => (
          <div key={check.id} className={`bg-surface border rounded-lg px-4 py-3 transition-all ${
            check.overdue ? 'border-yellow-500/50' : 'border-card'
          } ${!check.enabled ? 'opacity-50' : ''}`}>
            {editingCheck === check.id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{check.name}</span>
                  <span className="text-xs text-muted font-mono">{check.id}</span>
                </div>
                <textarea value={checks.find(c=>c.id===check.id)?.description || ''}
                  onChange={e => setChecks(prev => prev.map(c => c.id===check.id ? {...c, description: e.target.value} : c))}
                  className="w-full bg-card border border-accent rounded px-3 py-2 text-xs text-text h-16 resize-none focus:outline-none focus:border-highlight"
                  placeholder="What should I check?" />
                <div className="flex gap-3 items-center">
                  <div>
                    <label className="text-[10px] text-muted">Every (hours)</label>
                    <input type="number" min="1" max="48"
                      value={checks.find(c=>c.id===check.id)?.frequencyHours || 4}
                      onChange={e => setChecks(prev => prev.map(c => c.id===check.id ? {...c, frequencyHours: parseInt(e.target.value)} : c))}
                      className="w-20 bg-card border border-accent rounded px-2 py-1 text-xs text-text ml-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted">Priority</label>
                    <select value={checks.find(c=>c.id===check.id)?.priority || 'medium'}
                      onChange={e => setChecks(prev => prev.map(c => c.id===check.id ? {...c, priority: e.target.value} : c))}
                      className="bg-card border border-accent rounded px-2 py-1 text-xs text-text ml-1">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted">Fixed time</label>
                    <input type="time"
                      value={checks.find(c=>c.id===check.id)?.fixedTime || ''}
                      onChange={e => setChecks(prev => prev.map(c => c.id===check.id ? {...c, fixedTime: e.target.value} : c))}
                      className="bg-card border border-accent rounded px-2 py-1 text-xs text-text ml-1" />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => saveCheck(checks.find(c=>c.id===check.id))}
                    className="bg-highlight text-white px-3 py-1 rounded text-xs">Save</button>
                  <button onClick={() => { setEditingCheck(null); loadChecks() }}
                    className="text-muted text-xs hover:text-text">Cancel</button>
                  <button onClick={() => deleteCheck(check.id)}
                    className="text-red-400/70 text-xs hover:text-red-400 ml-auto">Delete</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <button onClick={() => toggleCheck(check)}
                    className={`w-9 h-[18px] md:w-10 md:h-5 rounded-full transition-all relative shrink-0 ${check.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full transition-all ${check.enabled ? 'left-[18px] md:left-5' : 'left-0.5'}`} />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs md:text-sm font-medium text-text">{check.name}</span>
                      <span className={`text-[10px] ${check.overdue ? 'text-yellow-400' : 'text-muted'}`}>
                        {check.lastRun ? timeAgo(check.lastRun) : 'never'}
                        {check.overdue && ' ⚠️'}
                      </span>
                    </div>
                    <div className="text-[10px] md:text-xs text-muted truncate">{check.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted hidden md:inline">/{check.frequencyHours}h</span>
                  <button onClick={() => setEditingCheck(check.id)}
                    className="text-xs text-muted hover:text-text p-1">✏️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new check */}
      {addingCheck && (
        <div className="bg-surface border border-highlight/30 rounded-lg p-4 mt-2">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <input value={newCheck.id} onChange={e => setNewCheck(p => ({...p, id: e.target.value.replace(/\s/g,'_')}))}
              placeholder="check_id" className="bg-card border border-accent rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-highlight" />
            <input value={newCheck.name} onChange={e => setNewCheck(p => ({...p, name: e.target.value}))}
              placeholder="📋 Check Name" className="bg-card border border-accent rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-highlight" />
          </div>
          <textarea value={newCheck.description} onChange={e => setNewCheck(p => ({...p, description: e.target.value}))}
            placeholder="What should I check?" className="w-full bg-card border border-accent rounded px-3 py-2 text-xs text-text h-12 resize-none focus:outline-none focus:border-highlight mb-2" />
          <div className="flex gap-3 items-center">
            <div><label className="text-[10px] text-muted">Every</label>
              <input type="number" min="1" value={newCheck.frequencyHours}
                onChange={e => setNewCheck(p => ({...p, frequencyHours: parseInt(e.target.value)}))}
                className="w-16 bg-card border border-accent rounded px-2 py-1 text-xs text-text ml-1" />
              <span className="text-[10px] text-muted ml-1">hours</span>
            </div>
            <select value={newCheck.priority} onChange={e => setNewCheck(p => ({...p, priority: e.target.value}))}
              className="bg-card border border-accent rounded px-2 py-1 text-xs text-text">
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <button onClick={addCheck} className="bg-highlight text-white px-3 py-1 rounded text-xs ml-auto">Add</button>
            <button onClick={() => setAddingCheck(false)} className="text-muted text-xs hover:text-text">Cancel</button>
          </div>
        </div>
      )}
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
      <h3 className="text-xs md:text-sm font-semibold text-muted uppercase tracking-wider mb-2">🧠 Model</h3>
      <div className="flex gap-2">
        {MODELS.map(m => {
          const active = current === m.id
          return (
            <button key={m.id} onClick={() => !active && change(m.id)} disabled={saving}
              className={`flex-1 border rounded-lg p-2.5 md:p-4 text-center transition-all ${
                active ? 'border-highlight bg-highlight/10' : 'border-card bg-surface hover:border-accent'
              }`}>
              <div className="text-xs md:text-sm font-medium text-text">{m.label}</div>
              <div className="text-[10px] text-muted">{m.cost}</div>
              {active && <div className="text-[10px] text-highlight mt-0.5">● Active</div>}
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
      <div className="bg-surface border border-card rounded-lg divide-y divide-card max-h-60 md:max-h-80 overflow-auto">
        {items.map(item => (
          <label key={item.line}
            className={`flex items-start gap-2 md:gap-3 px-3 md:px-4 py-2 cursor-pointer hover:bg-card/50 transition-all ${item.done ? 'opacity-40' : ''}`}>
            <input type="checkbox" checked={item.done} onChange={() => toggle(item)}
              className="mt-0.5 w-4 h-4 rounded border-accent bg-card text-highlight focus:ring-highlight shrink-0" />
            <span className={`text-xs md:text-sm ${item.done ? 'line-through text-muted' : 'text-text'}`}>{item.text}</span>
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
    <div className="h-full overflow-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-2xl font-bold text-text">🎛️ Control</h2>
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
