import { useState, useEffect } from 'react'
import { tasksApi, cronApi } from '../api'

function timeAgo(ts) {
  if (!ts) return 'never'
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function sessionName(s) {
  if (s.label) return s.label
  return (s.displayName || s.key || '?').replace('whatsapp:g-','').replace('agent-main-','').replace(/-/g,' ')
}

// ─── Task Card ────────────────────────────────────
function TaskCard({ task, onMove, onDelete }) {
  const statuses = ['backlog', 'in_progress', 'review', 'done']
  const idx = statuses.indexOf(task.status)
  const pColor = { urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-muted' }
  return (
    <div className="bg-background border border-card rounded-lg p-3 hover:border-highlight/40 transition-all">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm text-text">{task.title}</h4>
        <span className={`text-xs px-1.5 py-0.5 rounded ${pColor[task.priority] || 'text-muted'}`}>{task.priority}</span>
      </div>
      {task.description && <p className="text-xs text-muted mb-2 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{timeAgo(new Date(task.createdAt).getTime())}</span>
        <div className="flex gap-1">
          {idx > 0 && <button onClick={() => onMove(task.id, statuses[idx-1])} className="hover:text-text px-1">←</button>}
          {idx < 3 && <button onClick={() => onMove(task.id, statuses[idx+1])} className="hover:text-text px-1">→</button>}
          <button onClick={() => onDelete(task.id)} className="hover:text-red-400 px-1 ml-1">×</button>
        </div>
      </div>
    </div>
  )
}

// ─── Tasks Section ────────────────────────────────
function TasksSection() {
  const [tasks, setTasks] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('medium')

  useEffect(() => { loadTasks() }, [])
  const loadTasks = async () => {
    try { const d = await tasksApi.list(); setTasks(d.tasks || []) } catch (e) { console.error(e) }
  }
  const addTask = async () => {
    if (!newTitle.trim()) return
    try {
      await tasksApi.create({ title: newTitle, description: newDesc, priority: newPriority })
      setNewTitle(''); setNewDesc(''); setShowAdd(false); loadTasks()
    } catch (e) { alert('Error: ' + e.message) }
  }
  const moveTask = async (id, newStatus) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)
    setTasks(updated)
    try { await tasksApi.update({ tasks: updated, nextId: Math.max(...tasks.map(t => t.id), 0) + 1 }) }
    catch (e) { loadTasks() }
  }
  const deleteTask = async (id) => {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated)
    try { await tasksApi.update({ tasks: updated, nextId: Math.max(...tasks.map(t => t.id), 0) + 1 }) }
    catch (e) { loadTasks() }
  }

  const columns = [
    { id: 'backlog', label: 'Backlog', icon: '📥', color: 'border-t-gray-500' },
    { id: 'in_progress', label: 'In Progress', icon: '🔨', color: 'border-t-indigo-500' },
    { id: 'review', label: 'Review', icon: '👀', color: 'border-t-yellow-500' },
    { id: 'done', label: 'Done', icon: '✅', color: 'border-t-green-500' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">📋 Tasks</h3>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-highlight hover:bg-highlight/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
          + New Task
        </button>
      </div>
      {showAdd && (
        <div className="bg-surface border border-card rounded-lg p-4 mb-4">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title..." autoFocus
            className="w-full bg-card border border-accent rounded px-3 py-2 text-sm text-text mb-2 focus:outline-none focus:border-highlight" />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..."
            className="w-full bg-card border border-accent rounded px-3 py-2 text-sm text-text mb-2 h-16 resize-none focus:outline-none focus:border-highlight" />
          <div className="flex items-center gap-3">
            <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
              className="bg-card border border-accent rounded px-3 py-2 text-sm text-text focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button onClick={addTask} className="bg-highlight text-white px-4 py-2 rounded text-sm">Create</button>
            <button onClick={() => setShowAdd(false)} className="text-muted hover:text-text px-3 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} className={`bg-surface rounded-lg border border-card border-t-2 ${col.color}`}>
              <div className="px-3 py-2 border-b border-card flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{col.icon}</span>
                  <span className="text-xs font-medium text-text">{col.label}</span>
                </div>
                <span className="text-[10px] text-muted bg-card px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {colTasks.map(t => <TaskCard key={t.id} task={t} onMove={moveTask} onDelete={deleteTask} />)}
                {colTasks.length === 0 && <div className="text-center text-muted text-[10px] py-6 opacity-50">Empty</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Activity Section ─────────────────────────────
function ActivitySection({ sessions = [] }) {
  const [cronJobs, setCronJobs] = useState([])
  useEffect(() => {
    cronApi.list().then(d => setCronJobs(d.jobs || [])).catch(() => {})
  }, [])

  const sorted = [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  return (
    <div>
      <h3 className="text-lg font-semibold text-text mb-4">📈 Activity</h3>

      {/* Recent sessions */}
      <div className="space-y-2 mb-6">
        {sorted.slice(0, 10).map(s => {
          const active = s.updatedAt && (Date.now() - s.updatedAt) < 300000
          return (
            <div key={s.key} className="bg-surface border border-card rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                <div>
                  <span className="text-sm font-medium text-text">{sessionName(s)}</span>
                  <span className="text-xs text-muted ml-2">{s.kind}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>{(s.model||'').replace('claude-','').replace('anthropic/','')}</span>
                <span>{s.totalTokens ? `${(s.totalTokens/1000).toFixed(1)}K tok` : ''}</span>
                <span>{timeAgo(s.updatedAt)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cron jobs */}
      {cronJobs.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">⏰ Cron Jobs</h4>
          <div className="space-y-2">
            {cronJobs.map(job => (
              <div key={job.id} className="bg-surface border border-card rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${job.enabled ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className="text-sm font-medium text-text">{job.name || (job.id||'').slice(0,8)}</span>
                    <span className="text-xs text-muted bg-card px-1.5 py-0.5 rounded font-mono">{job.schedule?.expr || '?'}</span>
                  </div>
                  <span className={`text-xs ${job.enabled ? 'text-green-400' : 'text-muted'}`}>
                    {job.enabled ? 'active' : 'off'}
                  </span>
                </div>
                {job.payload?.text && <p className="text-xs text-muted mt-1 truncate">{job.payload.text}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Combined Page ────────────────────────────────
export default function TasksActivity({ sessions }) {
  const [view, setView] = useState('tasks')

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text">Work</h2>
        <div className="flex gap-1 bg-card rounded-lg p-0.5">
          {[
            { id: 'tasks', label: '📋 Tasks' },
            { id: 'activity', label: '📈 Activity' },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === t.id ? 'bg-highlight text-white' : 'text-muted hover:text-text'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'tasks' && <TasksSection />}
      {view === 'activity' && <ActivitySection sessions={sessions} />}
    </div>
  )
}
