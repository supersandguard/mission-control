import { useState, useEffect, useCallback } from 'react'
import { cronApi } from '../api'

const API = '/api'
function api(url, opts = {}) {
  const token = localStorage.getItem('mc_token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...opts.headers }
  return fetch(API + url, { ...opts, headers }).then(r => r.json())
}

function fmtBytes(b) { return b >= 1e9 ? `${(b/1e9).toFixed(1)}G` : `${(b/1e6).toFixed(0)}M` }
function fmtUptime(s) {
  const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60)
  return d > 0 ? `${d}d${h}h` : h > 0 ? `${h}h${m}m` : `${m}m`
}
function timeAgo(ts) {
  if (!ts) return 'never'
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h` : `${Math.floor(h/24)}d`
}

const MODELS = [
  { id: 'anthropic/claude-opus-4-5', label: 'Opus 4.5', short: 'opus-4-5' },
  { id: 'anthropic/claude-sonnet-4-20250514', label: 'Sonnet 4', short: 'sonnet-4' },
  { id: 'anthropic/claude-haiku-4-20250514', label: 'Haiku 4', short: 'haiku-4' },
]

// ═══════════════════════════════════════════════════
// STATUS BAR — compact system info + model selector
// ═══════════════════════════════════════════════════
function StatusBar({ status, onPatch }) {
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  if (!status) return null

  const mem = status.memory || {}
  const model = (status.model || '').replace('anthropic/claude-','')
  const memColor = mem.pct > 85 ? 'text-red-400' : mem.pct > 70 ? 'text-yellow-400' : 'text-green-400'
  const ctx = status.session?.context || '?'

  const changeModel = async (id) => {
    setSaving(true)
    await onPatch({ agents: { defaults: { model: id } } })
    setShowModelPicker(false)
    setSaving(false)
  }

  return (
    <div className="bg-surface border border-card rounded-lg p-3 relative">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Model - clickable */}
        <button onClick={() => setShowModelPicker(!showModelPicker)}
          className="flex items-center gap-1.5 bg-highlight/10 border border-highlight/30 rounded-md px-2.5 py-1 hover:bg-highlight/20 transition-all">
          <span className="text-xs font-medium text-highlight">{model}</span>
          <span className="text-[10px] text-muted">ctx {ctx}</span>
          <span className="text-[10px] text-muted">▼</span>
        </button>

        {/* System stats inline */}
        <div className="flex items-center gap-3 text-[10px] md:text-xs text-muted">
          <span className={memColor}>RAM {mem.pct}%</span>
          <span>SD {status.disk?.pct}</span>
          {status.ssd?.pct && <span>SSD {status.ssd?.pct}</span>}
          <span>CPU {status.cpu?.load?.[0]?.toFixed(1)}</span>
          <span>Up {fmtUptime(status.systemUptime)}</span>
          <span className="hidden md:inline font-mono">v{status.session?.version}</span>
        </div>
      </div>

      {/* Model picker dropdown */}
      {showModelPicker && (
        <div className="absolute left-0 top-full mt-1 bg-surface border border-card rounded-lg shadow-xl z-10 w-64">
          {MODELS.map(m => {
            const active = status.model === m.id
            return (
              <button key={m.id} onClick={() => !active && !saving && changeModel(m.id)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-card transition-all first:rounded-t-lg last:rounded-b-lg ${active ? 'text-highlight' : 'text-text'}`}>
                <span>{m.label}</span>
                {active && <span className="text-xs">● Active</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// HEARTBEAT SECTION
// ═══════════════════════════════════════════════════
function HeartbeatSection({ status, onPatch }) {
  const hb = status?.heartbeat || {}
  const [editSchedule, setEditSchedule] = useState(false)
  const [freq, setFreq] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
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
    try { const d = await api('/heartbeat/checks'); setChecks(d.checks || []) } catch (e) {}
  }

  const saveSchedule = async () => {
    await onPatch({ agents: { defaults: { heartbeat: { every: `${freq}min`, activeHours: { start, end } } } } })
    setEditSchedule(false)
  }

  const toggleCheck = async (check) => {
    setChecks(prev => prev.map(c => c.id === check.id ? { ...c, enabled: !c.enabled } : c))
    try { await api(`/heartbeat/checks/${check.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !check.enabled }) }) }
    catch (e) { loadChecks() }
  }

  const saveCheck = async (check) => {
    await api(`/heartbeat/checks/${check.id}`, { method: 'PATCH', body: JSON.stringify({ description: check.description, frequencyHours: check.frequencyHours, priority: check.priority, fixedTime: check.fixedTime || undefined }) })
    setEditingCheck(null); loadChecks()
  }

  const addCheck = async () => {
    if (!newCheck.id || !newCheck.name) return
    await api('/heartbeat/checks', { method: 'POST', body: JSON.stringify({ ...newCheck, enabled: true }) })
    setAddingCheck(false); setNewCheck({ id: '', name: '', description: '', frequencyHours: 4, priority: 'medium' }); loadChecks()
  }

  const deleteCheck = async (id) => {
    if (!confirm('Delete this check?')) return
    await api(`/heartbeat/checks/${id}`, { method: 'DELETE' }); loadChecks()
  }

  return (
    <section>
      {/* Header with schedule inline */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text">💓 Heartbeat</h3>
          <span className={`w-2 h-2 rounded-full ${hb.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
        {!editSchedule ? (
          <button onClick={() => setEditSchedule(true)} className="flex items-center gap-2 text-xs text-muted hover:text-text">
            <span>every {hb.every || '?'}</span>
            <span className="hidden md:inline">· {hb.activeHours ? `${hb.activeHours.start}–${hb.activeHours.end}` : '?'}</span>
            <span>✏️</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input type="number" value={freq} onChange={e => setFreq(e.target.value)} min="1" max="120"
              className="w-14 bg-card border border-accent rounded px-2 py-1 text-xs text-text" />
            <span className="text-xs text-muted">min</span>
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="bg-card border border-accent rounded px-1.5 py-1 text-xs text-text w-20" />
            <span className="text-xs text-muted">–</span>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="bg-card border border-accent rounded px-1.5 py-1 text-xs text-text w-20" />
            <button onClick={saveSchedule} className="text-xs text-highlight">✓</button>
            <button onClick={() => setEditSchedule(false)} className="text-xs text-muted">✕</button>
          </div>
        )}
      </div>

      {/* Checks */}
      <div className="space-y-1.5">
        {checks.map(check => (
          <div key={check.id} className={`rounded-lg px-3 py-2 transition-all ${
            check.overdue ? 'bg-yellow-500/5 border border-yellow-500/30' : 'bg-surface border border-card'
          } ${!check.enabled ? 'opacity-40' : ''}`}>
            {editingCheck === check.id ? (
              <div className="space-y-2">
                <textarea value={checks.find(c=>c.id===check.id)?.description || ''}
                  onChange={e => setChecks(prev => prev.map(c => c.id===check.id ? {...c, description: e.target.value} : c))}
                  className="w-full bg-card border border-accent rounded px-2 py-1.5 text-xs text-text h-14 resize-none focus:outline-none focus:border-highlight" />
                <div className="flex gap-2 items-center">
                  <input type="number" min="1" max="48" value={checks.find(c=>c.id===check.id)?.frequencyHours || 4}
                    onChange={e => setChecks(prev => prev.map(c => c.id===check.id ? {...c, frequencyHours: parseInt(e.target.value)} : c))}
                    className="w-14 bg-card border border-accent rounded px-2 py-1 text-xs text-text" />
                  <span className="text-[10px] text-muted">hours</span>
                  <button onClick={() => saveCheck(checks.find(c=>c.id===check.id))} className="text-xs text-highlight ml-auto">Save</button>
                  <button onClick={() => { setEditingCheck(null); loadChecks() }} className="text-xs text-muted">Cancel</button>
                  <button onClick={() => deleteCheck(check.id)} className="text-xs text-red-400/60 hover:text-red-400">Delete</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button onClick={() => toggleCheck(check)}
                    className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${check.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${check.enabled ? 'left-[14px]' : 'left-0.5'}`} />
                  </button>
                  <span className="text-xs font-medium text-text">{check.name}</span>
                  <span className="text-[10px] text-muted truncate hidden md:inline">{check.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] ${check.overdue ? 'text-yellow-400' : 'text-muted'}`}>
                    {check.lastRun ? timeAgo(check.lastRun) : '—'}{check.overdue ? ' ⚠️' : ''}
                  </span>
                  <span className="text-[10px] text-muted">/{check.frequencyHours}h</span>
                  <button onClick={() => setEditingCheck(check.id)} className="text-[10px] text-muted hover:text-text">✏️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add check */}
      {!addingCheck ? (
        <button onClick={() => setAddingCheck(true)} className="text-[10px] text-highlight hover:underline mt-2">+ Add check</button>
      ) : (
        <div className="bg-surface border border-card rounded-lg p-3 mt-2 space-y-2">
          <div className="flex gap-2">
            <input value={newCheck.id} onChange={e => setNewCheck(p => ({...p, id: e.target.value.replace(/\s/g,'_')}))}
              placeholder="check_id" className="flex-1 bg-card border border-accent rounded px-2 py-1.5 text-xs text-text" />
            <input value={newCheck.name} onChange={e => setNewCheck(p => ({...p, name: e.target.value}))}
              placeholder="📋 Name" className="flex-1 bg-card border border-accent rounded px-2 py-1.5 text-xs text-text" />
          </div>
          <input value={newCheck.description} onChange={e => setNewCheck(p => ({...p, description: e.target.value}))}
            placeholder="What to check..." className="w-full bg-card border border-accent rounded px-2 py-1.5 text-xs text-text" />
          <div className="flex items-center gap-2">
            <input type="number" min="1" value={newCheck.frequencyHours} onChange={e => setNewCheck(p => ({...p, frequencyHours: parseInt(e.target.value)}))}
              className="w-14 bg-card border border-accent rounded px-2 py-1 text-xs text-text" />
            <span className="text-[10px] text-muted">hours</span>
            <button onClick={addCheck} className="text-xs text-highlight ml-auto">Add</button>
            <button onClick={() => setAddingCheck(false)} className="text-xs text-muted">Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}

// ═══════════════════════════════════════════════════
// PENDIENTES SECTION
// ═══════════════════════════════════════════════════
function PendientesSection() {
  const [items, setItems] = useState([])
  const [showDone, setShowDone] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => { try { const d = await api('/pendientes'); setItems(d.items || []) } catch (e) {} }

  const toggle = async (item) => {
    setItems(prev => prev.map(i => i.line === item.line ? { ...i, done: !i.done } : i))
    try { await api(`/pendientes/${item.line}`, { method: 'PATCH', body: JSON.stringify({ done: !item.done }) }) }
    catch (e) { load() }
  }

  const addItem = async () => {
    if (!newText.trim()) return
    await api('/pendientes', { method: 'POST', body: JSON.stringify({ text: newText.trim() }) })
    setNewText(''); setAdding(false); load()
  }

  const pending = items.filter(i => !i.done)
  const done = items.filter(i => i.done)
  const pct = items.length > 0 ? Math.round((done.length / items.length) * 100) : 0

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text">📝 Pendientes</h3>
          <span className="text-[10px] text-muted">{pending.length} active</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-16 h-1.5 bg-card rounded-full overflow-hidden">
            <div className="h-full bg-highlight rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <button onClick={() => setAdding(!adding)} className="text-xs text-highlight hover:underline">+ Add</button>
        </div>
      </div>

      {adding && (
        <div className="flex gap-2 mb-2">
          <input value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addItem() }}
            placeholder="New task..." autoFocus
            className="flex-1 bg-card border border-accent rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-highlight" />
          <button onClick={addItem} disabled={!newText.trim()}
            className="bg-highlight text-white px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-40">Add</button>
          <button onClick={() => { setAdding(false); setNewText('') }} className="text-muted text-xs px-1">✕</button>
        </div>
      )}

      <div className="space-y-1">
        {pending.map(item => (
          <label key={item.line} className="flex items-start gap-2 px-3 py-2 bg-surface border border-card rounded-lg cursor-pointer hover:bg-card/50">
            <input type="checkbox" checked={false} onChange={() => toggle(item)}
              className="mt-0.5 w-4 h-4 rounded border-accent bg-card text-highlight shrink-0" />
            <span className="text-xs text-text">{item.text}</span>
          </label>
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-1.5 text-[10px] text-muted hover:text-text py-1">
            <span className={`transition-transform ${showDone ? 'rotate-90' : ''}`}>▶</span>
            Completed ({done.length})
          </button>
          {showDone && (
            <div className="space-y-1 mt-1 max-h-40 overflow-auto">
              {done.map(item => (
                <label key={item.line} className="flex items-start gap-2 px-3 py-1.5 opacity-40 cursor-pointer hover:opacity-60">
                  <input type="checkbox" checked={true} onChange={() => toggle(item)}
                    className="mt-0.5 w-4 h-4 rounded border-accent bg-card text-highlight shrink-0" />
                  <span className="text-[10px] line-through text-muted">{item.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ═══════════════════════════════════════════════════
// CRON SECTION
// ═══════════════════════════════════════════════════
function CronSection() {
  const [jobs, setJobs] = useState([])
  const [running, setRunning] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({})
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => { try { const d = await cronApi.list(); setJobs(d.jobs || []) } catch (e) {} }

  const runJob = async (job) => {
    setRunning(job.id)
    try { await api(`/cron/${job.id}/run`, { method: 'POST' }) } catch (e) { alert(e.message) }
    setRunning(null)
  }

  const archiveJob = async (job) => {
    await api(`/cron/${job.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !job.enabled }) }); load()
  }

  const startEdit = (job) => {
    setEditing(job.id)
    setEditFields({ name: job.name || '', expr: job.schedule?.expr || '', text: job.payload?.text || '' })
  }

  const saveEdit = async (job) => {
    const patch = { name: editFields.name }
    if (editFields.expr !== job.schedule?.expr) patch.schedule = { kind: 'cron', expr: editFields.expr }
    if (editFields.text !== job.payload?.text) patch.payload = { kind: 'systemEvent', text: editFields.text }
    await api(`/cron/${job.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    setEditing(null); load()
  }

  const cronHuman = (expr) => {
    if (!expr) return '?'
    const [min, hour] = expr.split(' ')
    if (hour && !hour.includes('*')) {
      if (hour.includes(',')) return `at ${hour.split(',').map(h => `${h}:${min.padStart(2,'0')}`).join(', ')}`
      return `daily ${hour.padStart(2,'0')}:${min.padStart(2,'0')}`
    }
    return expr
  }

  const active = jobs.filter(j => j.enabled)
  const archived = jobs.filter(j => !j.enabled)

  const renderJob = (job) => {
    const isExp = expanded === job.id
    const isEdit = editing === job.id
    return (
      <div key={job.id} className={`bg-surface border border-card rounded-lg overflow-hidden ${!job.enabled ? 'opacity-50' : ''}`}>
        <div className="px-3 py-2.5 flex items-center justify-between">
          <button onClick={() => setExpanded(isExp ? null : job.id)} className="flex items-center gap-2 min-w-0 text-left flex-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${job.enabled ? 'bg-green-500' : 'bg-gray-600'}`} />
            <span className="text-xs font-medium text-text truncate">{job.name || (job.id||'').slice(0,12)}</span>
            <span className="text-[10px] text-muted">{cronHuman(job.schedule?.expr)}</span>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            {job.enabled && (
              <button onClick={() => runJob(job)} disabled={running === job.id}
                className="text-[10px] text-highlight px-1.5 py-0.5 rounded hover:bg-highlight/10">
                {running === job.id ? '⏳' : '▶ Run'}
              </button>
            )}
            <button onClick={() => setExpanded(isExp ? null : job.id)}
              className={`text-[10px] text-muted px-1 transition-transform ${isExp ? 'rotate-180' : ''}`}>▼</button>
          </div>
        </div>

        {isExp && !isEdit && (
          <div className="px-3 pb-3 border-t border-card pt-2 space-y-2">
            <div className="flex gap-4 text-[10px]">
              <span className="text-muted">expr: <span className="text-text font-mono">{job.schedule?.expr}</span></span>
              <span className="text-muted">last: <span className="text-text">{job.state?.lastRunAtMs ? timeAgo(job.state.lastRunAtMs) : 'never'}</span></span>
              {job.state?.nextRunAtMs && <span className="text-muted">next: <span className="text-text">{new Date(job.state.nextRunAtMs).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span></span>}
            </div>
            {job.payload?.text && (
              <p className="text-[10px] md:text-xs text-text whitespace-pre-wrap bg-card rounded p-2 max-h-28 overflow-auto">{job.payload.text}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted font-mono">{(job.id||'').slice(0,8)}</span>
              <div className="flex gap-2">
                <button onClick={() => startEdit(job)} className="text-[10px] text-highlight">✏️ Edit</button>
                <button onClick={() => archiveJob(job)} className="text-[10px] text-yellow-400/70 hover:text-yellow-400">
                  {job.enabled ? '📦 Archive' : '↩ Restore'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isExp && isEdit && (
          <div className="px-3 pb-3 border-t border-card pt-2 space-y-2">
            <div className="flex gap-2">
              <input value={editFields.name} onChange={e => setEditFields(p => ({...p, name: e.target.value}))}
                placeholder="Name" className="flex-1 bg-card border border-accent rounded px-2 py-1.5 text-xs text-text" />
              <input value={editFields.expr} onChange={e => setEditFields(p => ({...p, expr: e.target.value}))}
                placeholder="0 8 * * *" className="w-28 bg-card border border-accent rounded px-2 py-1.5 text-xs text-text font-mono" />
            </div>
            <textarea value={editFields.text} onChange={e => setEditFields(p => ({...p, text: e.target.value}))}
              className="w-full bg-card border border-accent rounded px-2 py-1.5 text-xs text-text h-20 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => saveEdit(job)} className="text-xs text-highlight">Save</button>
              <button onClick={() => setEditing(null)} className="text-xs text-muted">Cancel</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-text mb-3">⏰ Cron Jobs</h3>
      <div className="space-y-1.5">{active.map(renderJob)}</div>
      {archived.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 text-[10px] text-muted hover:text-text py-1">
            <span className={`transition-transform ${showArchived ? 'rotate-90' : ''}`}>▶</span>
            Archived ({archived.length})
          </button>
          {showArchived && <div className="space-y-1.5 mt-1">{archived.map(renderJob)}</div>}
        </div>
      )}
    </section>
  )
}

// ═══════════════════════════════════════════════════
// TOOLS SECTION
// ═══════════════════════════════════════════════════
function ToolsSection() {
  const [tools, setTools] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => { try { const d = await api('/tools'); setTools(d.tools || []) } catch (e) {} }

  const statusStyle = { working: 'bg-green-500', issues: 'bg-yellow-500', broken: 'bg-red-500' }
  const statusLabel = { working: 'OK', issues: '⚠️', broken: '❌' }

  const updateStatus = async (tool, newStatus) => {
    setTools(prev => prev.map(t => t.id === tool.id ? { ...t, status: newStatus } : t))
    await api(`/tools/${tool.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-text mb-3">🧰 Tools</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {tools.map(tool => {
          const isExp = expanded === tool.id
          return (
            <div key={tool.id} className={`bg-surface border border-card rounded-lg overflow-hidden transition-all ${
              isExp ? 'col-span-2 md:col-span-3' : ''
            }`}>
              <button onClick={() => setExpanded(isExp ? null : tool.id)}
                className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-card/50 transition-all">
                <span className="text-sm">{tool.icon}</span>
                <span className="text-xs font-medium text-text flex-1 truncate">{tool.name}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusStyle[tool.status] || 'bg-gray-500'}`} />
              </button>

              {isExp && (
                <div className="px-3 pb-3 border-t border-card pt-2 space-y-1.5">
                  <p className="text-[10px] text-muted">{tool.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                    <span className="text-muted">Credentials: <span className="text-text">{tool.credentials}</span></span>
                    {tool.lastUsed && <span className="text-muted">Last used: <span className="text-text">{timeAgo(tool.lastUsed)}</span></span>}
                  </div>
                  {tool.notes && <p className="text-[10px] text-muted italic">{tool.notes}</p>}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-muted">Status:</span>
                    {['working', 'issues', 'broken'].map(s => (
                      <button key={s} onClick={() => updateStatus(tool, s)}
                        className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                          tool.status === s ? `${statusStyle[s]} text-white` : 'bg-card text-muted hover:text-text'
                        }`}>
                        {s === 'working' ? '✅ OK' : s === 'issues' ? '⚠️ Issues' : '❌ Broken'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════
// SKILLS SECTION
// ═══════════════════════════════════════════════════
function SkillsSection() {
  const [skills, setSkills] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [content, setContent] = useState({})
  const [loadingContent, setLoadingContent] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => { try { const d = await api('/skills'); setSkills(d.skills || []) } catch (e) {} }

  const loadContent = async (id) => {
    if (content[id]) return
    setLoadingContent(id)
    try { const d = await api(`/skills/${id}/content`); setContent(prev => ({ ...prev, [id]: d.content })) }
    catch (e) { setContent(prev => ({ ...prev, [id]: '⚠️ Could not load skill content' })) }
    setLoadingContent(null)
  }

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    loadContent(id)
  }

  const archiveSkill = async (skill) => {
    const newVal = !skill.archived
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, archived: newVal } : s))
    await api(`/skills/${skill.id}`, { method: 'PATCH', body: JSON.stringify({ archived: newVal }) })
  }

  const active = skills.filter(s => !s.archived)
  const archived = skills.filter(s => s.archived)

  const fmtDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const renderSkill = (skill) => {
    const isExp = expanded === skill.id
    return (
      <div key={skill.id} className={`bg-surface border border-card rounded-lg overflow-hidden ${skill.archived ? 'opacity-50' : ''}`}>
        <button onClick={() => toggleExpand(skill.id)}
          className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-card/50 transition-all">
          <span className="text-sm">{skill.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-text">{skill.name}</span>
            <p className="text-[10px] text-muted truncate">{skill.summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {skill.lastUsed && <span className="text-[10px] text-muted hidden md:inline">{timeAgo(skill.lastUsed)}</span>}
            <span className={`text-[10px] text-muted transition-transform ${isExp ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {isExp && (
          <div className="px-3 pb-3 border-t border-card pt-2 space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
              <span className="text-muted">Installed: <span className="text-text">{fmtDate(skill.installed)}</span></span>
              <span className="text-muted">Last used: <span className="text-text">{skill.lastUsed ? timeAgo(skill.lastUsed) : 'never'}</span></span>
            </div>

            {/* SKILL.md content */}
            <div className="relative">
              {loadingContent === skill.id ? (
                <div className="text-[10px] text-muted py-4 text-center">Loading...</div>
              ) : content[skill.id] ? (
                <pre className="text-[10px] md:text-xs text-text whitespace-pre-wrap bg-card rounded-lg p-3 max-h-64 overflow-auto font-mono leading-relaxed">
                  {content[skill.id]}
                </pre>
              ) : null}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted font-mono">{skill.id}</span>
              <button onClick={() => archiveSkill(skill)}
                className={`text-[10px] ${skill.archived ? 'text-green-400/70 hover:text-green-400' : 'text-yellow-400/70 hover:text-yellow-400'}`}>
                {skill.archived ? '↩ Restore' : '📦 Archive'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">🧠 Skills</h3>
        <span className="text-[10px] text-muted">{active.length} active</span>
      </div>
      <div className="space-y-1.5">{active.map(renderSkill)}</div>
      {archived.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 text-[10px] text-muted hover:text-text py-1">
            <span className={`transition-transform ${showArchived ? 'rotate-90' : ''}`}>▶</span>
            Archived ({archived.length})
          </button>
          {showArchived && <div className="space-y-1.5 mt-1">{archived.map(renderSkill)}</div>}
        </div>
      )}
    </section>
  )
}

// ═══════════════════════════════════════════════════
// CONTROL PANEL
// ═══════════════════════════════════════════════════
export default function Control() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setStatus(await api('/status')) } catch (e) {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])
  useEffect(() => { const id = setInterval(load, 30000); return () => clearInterval(id) }, [load])

  const patchConfig = async (patch) => {
    await api('/gateway/config', { method: 'PATCH', body: JSON.stringify(patch) })
    setTimeout(load, 3000)
  }

  if (loading) return <div className="flex items-center justify-center h-full text-muted">Loading...</div>

  return (
    <div className="h-full overflow-auto p-3 md:p-6 space-y-5">
      <StatusBar status={status} onPatch={patchConfig} />

      <div className="border-t border-card/50" />
      <HeartbeatSection status={status} onPatch={patchConfig} />

      <div className="border-t border-card/50" />
      <PendientesSection />

      <div className="border-t border-card/50" />
      <CronSection />

      <div className="border-t border-card/50" />
      <ToolsSection />

      <div className="border-t border-card/50" />
      <SkillsSection />
    </div>
  )
}
