import { useState, useEffect, useMemo } from 'react'
import { sessionsApi, agentsApi } from '../api'

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
function fmtTokens(n) {
  if (!n) return '0'
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`
  return String(n)
}
function modelShort(m) { return m ? m.replace('claude-','').replace('anthropic/','').replace('-20250514','') : '?' }
function isActive(s) { return s.updatedAt && (Date.now() - s.updatedAt) < 300000 }

const MODELS = [
  { id: 'anthropic/claude-opus-4-5', label: 'Opus 4.5' },
  { id: 'anthropic/claude-sonnet-4-20250514', label: 'Sonnet 4' },
  { id: 'anthropic/claude-haiku-4-20250514', label: 'Haiku 4' },
]

const EMOJIS = ['🖤','🤖','🔧','👥','💬','🧠','🔬','✍️','🎨','📊','🛡️','⚡','🦊','👻','🎯','🔥']

// ─── Session Row ──────────────────────────────────
function SessionRow({ session, agent, onSelect, selected, onEditAgent, onDelete }) {
  const active = isActive(session)
  const isSub = (session.key||'').includes('subagent')
  const dead = isSub && !active
  const name = agent?.name || session.label || (session.displayName || session.key || '?').replace('whatsapp:g-','').replace('agent-main-','').replace(/-/g,' ')
  const icon = agent?.emoji || (session.label ? '🔧' : session.kind === 'group' ? '👥' : isSub ? '🤖' : session.key === 'agent:main:main' ? '🖤' : '💬')
  const role = agent?.role

  return (
    <div className={`flex items-center border-b border-card/50 transition-all hover:bg-card ${selected ? 'bg-card border-l-2 border-l-highlight' : ''} ${dead ? 'opacity-50' : ''}`}>
      <button onClick={() => onSelect(session)} className="flex-1 text-left px-4 py-3 flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-text">{name}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            {dead && <span className="text-[10px] text-red-400/70 bg-red-400/10 px-1 rounded">done</span>}
          </div>
          {role && <div className="text-xs text-highlight truncate">{role}</div>}
          <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
            <span>{modelShort(session.model)}</span>
            <span>{fmtTokens(session.totalTokens)} tok</span>
            <span>{timeAgo(session.updatedAt)}</span>
          </div>
        </div>
      </button>
      <div className="flex shrink-0 mr-2 gap-0.5">
        <button onClick={() => onEditAgent(session, agent)}
          className="px-1.5 py-1 text-muted hover:text-text text-xs" title="Edit">✏️</button>
        {isSub && (
          <button onClick={() => onDelete(session)}
            className="px-1.5 py-1 text-muted hover:text-red-400 text-xs" title="Delete">🗑️</button>
        )}
      </div>
    </div>
  )
}

// ─── Agent Editor Modal ───────────────────────────
function AgentEditor({ session, agent, onSave, onClose }) {
  const [name, setName] = useState(agent?.name || '')
  const [role, setRole] = useState(agent?.role || '')
  const [emoji, setEmoji] = useState(agent?.emoji || '🤖')
  const [desc, setDesc] = useState(agent?.description || '')
  const [showEmojis, setShowEmojis] = useState(false)

  const defaultName = session.label || (session.displayName || '').replace('whatsapp:g-','').replace(/-/g,' ')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-card rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-text mb-1">Edit Agent</h3>
        <p className="text-xs text-muted font-mono mb-4">{session.key}</p>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative">
              <button onClick={() => setShowEmojis(!showEmojis)}
                className="w-14 h-14 bg-card border border-accent rounded-lg text-3xl hover:border-highlight transition-all flex items-center justify-center">
                {emoji}
              </button>
              {showEmojis && (
                <div className="absolute top-full left-0 mt-1 bg-surface border border-card rounded-lg p-2 grid grid-cols-4 gap-1 z-10 shadow-xl">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { setEmoji(e); setShowEmojis(false) }}
                      className="w-8 h-8 hover:bg-card rounded flex items-center justify-center text-lg">{e}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder={defaultName || 'Agent name...'}
                className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight mb-1.5" />
              <input value={role} onChange={e => setRole(e.target.value)}
                placeholder="Role (e.g. Researcher, Writer...)"
                className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight" />
            </div>
          </div>

          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Description..."
            className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text h-20 resize-none focus:outline-none focus:border-highlight" />
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={() => onSave({ id: session.key.replace(/[^a-zA-Z0-9]/g, '-'), name: name || defaultName, role, emoji, description: desc, sessionKey: session.key })}
            className="flex-1 bg-highlight hover:bg-highlight/80 text-white py-2 rounded-lg text-sm font-medium transition-all">
            Save
          </button>
          <button onClick={onClose}
            className="px-4 py-2 bg-card border border-accent rounded-lg text-sm text-muted hover:text-text transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Spawn Modal ──────────────────────────────────
function SpawnModal({ onSpawn, onClose }) {
  const [task, setTask] = useState('')
  const [label, setLabel] = useState('')
  const [model, setModel] = useState('anthropic/claude-sonnet-4-20250514')
  const [spawning, setSpawning] = useState(false)

  const doSpawn = async () => {
    if (!task.trim()) return
    setSpawning(true)
    try {
      await onSpawn({ task, label: label || undefined, model })
      onClose()
    } catch (e) { alert('Error: ' + e.message) }
    setSpawning(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-card rounded-xl p-6 w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-text mb-4">🚀 Spawn Sub-Agent</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Task</label>
            <textarea value={task} onChange={e => setTask(e.target.value)} autoFocus
              placeholder="Describe what this agent should do..."
              className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text h-28 resize-none focus:outline-none focus:border-highlight" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">Label (optional)</label>
              <input value={label} onChange={e => setLabel(e.target.value)}
                placeholder="research-task"
                className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight" />
            </div>
            <div className="w-40">
              <label className="text-xs text-muted block mb-1">Model</label>
              <select value={model} onChange={e => setModel(e.target.value)}
                className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none">
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={doSpawn} disabled={spawning || !task.trim()}
            className="flex-1 bg-highlight hover:bg-highlight/80 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-medium transition-all">
            {spawning ? 'Spawning...' : '🚀 Launch'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2 bg-card border border-accent rounded-lg text-sm text-muted hover:text-text transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Session Detail ───────────────────────────────
function SessionDetail({ session, agent, onBack }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { if (session) loadHistory() }, [session?.key])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await sessionsApi.getHistory(session.key, { limit: 20 })
      setHistory(data.messages || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const sendMsg = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await sessionsApi.sendMessage(session.key, message.trim())
      setMessage('')
      setTimeout(loadHistory, 2000)
    } catch (e) { alert('Error: ' + e.message) }
    setSending(false)
  }

  if (!session) return (
    <div className="flex-1 flex items-center justify-center text-muted">
      <div className="text-center"><div className="text-4xl mb-3">👈</div><p>Select a session</p></div>
    </div>
  )

  const name = agent?.name || session.label || (session.displayName || '').replace('whatsapp:g-','').replace(/-/g,' ')
  const icon = agent?.emoji || '💬'
  const pct = ((session.totalTokens / (session.contextTokens || 200000)) * 100)

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="bg-surface border-b border-card px-3 md:px-5 py-3 md:py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={onBack} className="md:hidden text-xs text-highlight mb-1 block">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <h2 className="text-lg font-semibold text-text">{name}</h2>
              {agent?.role && <span className="text-xs bg-highlight/20 text-highlight px-2 py-0.5 rounded-full">{agent.role}</span>}
              <span className={`w-2.5 h-2.5 rounded-full ${isActive(session) ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            </div>
            <span className="font-mono text-xs bg-card px-2 py-0.5 rounded text-muted mt-1 inline-block">{session.key}</span>
            {agent?.description && <p className="text-xs text-muted mt-1">{agent.description}</p>}
          </div>
          <div className="text-right text-sm space-y-0.5">
            <div className="text-muted">Model: <span className="text-text">{modelShort(session.model)}</span></div>
            <div className="text-muted">Tokens: <span className="text-text">{fmtTokens(session.totalTokens)}</span></div>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <div className="h-full bg-highlight rounded-full transition-all" style={{width: `${Math.min(100, pct)}%`}} />
          </div>
          <div className="text-xs text-muted mt-1">{pct.toFixed(1)}% context</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading && <div className="text-center text-muted py-8">Loading...</div>}
        {!loading && history.length === 0 && <div className="text-center text-muted py-8">No messages</div>}
        {history.map((msg, i) => {
          let text = ''
          let hasTools = false
          if (typeof msg.content === 'string') text = msg.content
          else if (Array.isArray(msg.content)) {
            msg.content.forEach(c => {
              if (c.type === 'text' && c.text) text += (text ? '\n' : '') + c.text
              if (c.type === 'toolCall') hasTools = true
            })
          }
          if (!text && !hasTools) return null
          const isUser = msg.role === 'user'
          const cost = msg.usage?.cost?.total
          return (
            <div key={i} className={isUser ? 'flex justify-end' : ''}>
              <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                isUser ? 'bg-highlight/10 border border-highlight/30' : 'bg-card border border-card'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-text">{isUser ? '👤 User' : '🤖 Assistant'}</span>
                  {msg.timestamp && <span className="text-xs text-muted">{timeAgo(msg.timestamp)}</span>}
                  {cost > 0 && <span className="text-xs text-muted">${cost.toFixed(4)}</span>}
                </div>
                {text && <div className="text-sm text-text whitespace-pre-wrap break-words">{text.slice(0,3000)}{text.length > 3000 ? '...' : ''}</div>}
                {hasTools && !text && <div className="text-xs text-muted italic">🔧 Using tools...</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="border-t border-card p-4 bg-surface shrink-0">
        <div className="flex gap-2">
          <input value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMsg() }}
            placeholder={`Message ${name}...`}
            className="flex-1 bg-card border border-accent rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-highlight"
            disabled={sending} />
          <button onClick={sendMsg} disabled={sending || !message.trim()}
            className="bg-highlight hover:bg-highlight/80 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
            {sending ? '...' : 'Send'}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted">Enter to send</span>
          <button onClick={loadHistory} className="text-xs text-highlight hover:underline">↻ Refresh</button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────
export default function Dashboard({ sessions, onRefresh }) {
  const [selected, setSelected] = useState(null)
  const [agents, setAgents] = useState({}) // keyed by sessionKey
  const [editingAgent, setEditingAgent] = useState(null) // { session, agent }
  const [showSpawn, setShowSpawn] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  // Load agent registry
  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    if (!selected && sessions.length > 0) setSelected(sessions[0])
  }, [sessions])

  const loadAgents = async () => {
    try {
      const data = await agentsApi.list()
      const map = {}
      ;(data.agents || []).forEach(a => { map[a.sessionKey] = a })
      setAgents(map)
    } catch (e) { console.error(e) }
  }

  const saveAgent = async (agent) => {
    const updated = { ...agents, [agent.sessionKey]: agent }
    setAgents(updated)
    try {
      await agentsApi.update({ agents: Object.values(updated) })
    } catch (e) { console.error(e) }
    setEditingAgent(null)
  }

  const spawnAgent = async (params) => {
    await sessionsApi.spawn(params)
    setTimeout(onRefresh, 2000)
  }

  const deleteSession = async (session) => {
    const name = session.label || session.key
    if (!confirm(`Delete sub-agent "${name}"?\nThis removes the session and its transcript.`)) return
    try {
      await sessionsApi.delete(session.key)
      if (selected?.key === session.key) setSelected(null)
      onRefresh()
    } catch (e) { alert('Error: ' + e.message) }
  }

  const cleanupOld = async () => {
    setCleaning(true)
    try {
      const result = await sessionsApi.cleanup(24)
      alert(`Cleaned up ${result.count} sub-agent(s)${result.deleted?.length ? ':\n' + result.deleted.map(d => d.label || d.key).join('\n') : ''}`)
      onRefresh()
    } catch (e) { alert('Error: ' + e.message) }
    setCleaning(false)
  }

  const current = useMemo(() => {
    if (!selected) return null
    return sessions.find(s => s.key === selected.key) || selected
  }, [sessions, selected?.key])

  // Group sessions
  const grouped = useMemo(() => {
    const registered = []
    const groups = []
    const subagents = []
    const other = []
    sessions.forEach(s => {
      if (agents[s.key]) registered.push(s)
      else if (s.kind === 'group') groups.push(s)
      else if ((s.key||'').includes('subagent')) subagents.push(s)
      else other.push(s)
    })
    return { registered, groups, subagents, other }
  }, [sessions, agents])

  const renderSection = (label, items, extra) => {
    if (items.length === 0) return null
    return (
      <>
        <div className="px-4 py-1.5 bg-card/50 text-xs text-muted uppercase tracking-wider font-medium flex items-center justify-between">
          <span>{label}</span>
          {extra}
        </div>
        {items.map(s => (
          <SessionRow key={s.key} session={s} agent={agents[s.key]}
            onSelect={setSelected} selected={selected?.key === s.key}
            onEditAgent={(sess, ag) => setEditingAgent({ session: sess, agent: ag })}
            onDelete={deleteSession} />
        ))}
      </>
    )
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Session list */}
      <div className={`${selected ? 'hidden md:block' : ''} w-full md:w-80 shrink-0 border-r border-card overflow-auto bg-background`}>
        <div className="px-4 py-3 border-b border-card flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Sessions</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowSpawn(true)}
              className="text-xs bg-highlight/20 text-highlight hover:bg-highlight/30 px-2 py-1 rounded transition-all">
              🚀 Spawn
            </button>
            <button onClick={onRefresh} className="text-xs text-highlight hover:underline">↻</button>
          </div>
        </div>
        {renderSection('⭐ Agents', grouped.registered)}
        {renderSection('👥 Groups', grouped.groups)}
        {renderSection('💬 Direct', grouped.other)}
        {renderSection('🤖 Sub-agents', grouped.subagents,
          grouped.subagents.length > 0 && (
            <button onClick={cleanupOld} disabled={cleaning}
              className="text-[10px] text-red-400/70 hover:text-red-400 transition-all">
              {cleaning ? '...' : '🧹 Cleanup old'}
            </button>
          )
        )}
        {sessions.length === 0 && <div className="p-8 text-center text-muted text-sm">No sessions</div>}
      </div>

      {/* Detail */}
      <SessionDetail session={current} agent={current ? agents[current.key] : null}
        onBack={() => setSelected(null)} />

      {/* Modals */}
      {editingAgent && (
        <AgentEditor session={editingAgent.session} agent={editingAgent.agent}
          onSave={saveAgent} onClose={() => setEditingAgent(null)} />
      )}
      {showSpawn && (
        <SpawnModal onSpawn={spawnAgent} onClose={() => setShowSpawn(false)} />
      )}
    </div>
  )
}
