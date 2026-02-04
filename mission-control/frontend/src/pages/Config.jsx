import { useState, useEffect } from 'react'

function authHeaders() {
  const token = localStorage.getItem('mc_token')
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const FILES = [
  { id: 'memory', label: 'MEMORY.md', icon: '🧠', desc: 'Memoria de largo plazo' },
  { id: 'heartbeat', label: 'HEARTBEAT.md', icon: '💓', desc: 'Checklist de tareas periódicas' },
  { id: 'soul', label: 'SOUL.md', icon: '👻', desc: 'Personalidad y comportamiento' },
  { id: 'user', label: 'USER.md', icon: '👤', desc: 'Info sobre Alberto' },
  { id: 'identity', label: 'IDENTITY.md', icon: '🎭', desc: 'Identidad de Max Umbra' },
  { id: 'tools', label: 'TOOLS.md', icon: '🔧', desc: 'Herramientas y notas locales' },
  { id: 'agents', label: 'AGENTS.md', icon: '📋', desc: 'Instrucciones del workspace' },
]

function FileEditor({ fileId, onBack }) {
  const [content, setContent] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const file = FILES.find(f => f.id === fileId)

  useEffect(() => { loadFile() }, [fileId])

  const loadFile = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/files/${fileId}`, { headers: authHeaders() })
      const data = await r.json()
      setContent(data.content || '')
      setOriginal(data.content || '')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const saveFile = async () => {
    setSaving(true)
    try {
      await fetch(`/api/files/${fileId}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ content }),
      })
      setOriginal(content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  const hasChanges = content !== original

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 bg-surface border-b border-card px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted hover:text-text text-sm">← Back</button>
          <span className="text-xl">{file?.icon}</span>
          <div>
            <h3 className="font-semibold text-text">{file?.label}</h3>
            <p className="text-xs text-muted">{file?.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
          {hasChanges && <span className="text-yellow-400 text-xs">unsaved changes</span>}
          <button onClick={saveFile} disabled={saving || !hasChanges}
            className="bg-highlight hover:bg-highlight/80 disabled:opacity-40 text-white px-4 py-1.5 rounded text-sm font-medium transition-all">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted">Loading...</div>
      ) : (
        <textarea value={content} onChange={e => setContent(e.target.value)}
          className="flex-1 bg-background text-text font-mono text-sm p-5 resize-none focus:outline-none"
          spellCheck={false} />
      )}
    </div>
  )
}

function MemoryDayEditor({ date, onBack }) {
  const [content, setContent] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadDay() }, [date])

  const loadDay = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/memory/${date}`, { headers: authHeaders() })
      const data = await r.json()
      setContent(data.content || '')
      setOriginal(data.content || '')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const saveDay = async () => {
    setSaving(true)
    try {
      await fetch(`/api/memory/${date}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ content }),
      })
      setOriginal(content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  const hasChanges = content !== original

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 bg-surface border-b border-card px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted hover:text-text text-sm">← Back</button>
          <span className="text-xl">📅</span>
          <div>
            <h3 className="font-semibold text-text">{date}</h3>
            <p className="text-xs text-muted">Notas del día</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
          {hasChanges && <span className="text-yellow-400 text-xs">unsaved changes</span>}
          <button onClick={saveDay} disabled={saving || !hasChanges}
            className="bg-highlight hover:bg-highlight/80 disabled:opacity-40 text-white px-4 py-1.5 rounded text-sm font-medium transition-all">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted">Loading...</div>
      ) : (
        <textarea value={content} onChange={e => setContent(e.target.value)}
          className="flex-1 bg-background text-text font-mono text-sm p-5 resize-none focus:outline-none"
          spellCheck={false} />
      )}
    </div>
  )
}

function MemoryView({ onEditDay }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { loadMemory() }, [])

  const loadMemory = async () => {
    try {
      const r = await fetch('/api/memory/recent', { headers: authHeaders() })
      const data = await r.json()
      setEntries(data.entries || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return <div className="text-center text-muted py-8">Loading...</div>

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-text">📅 Notas diarias</h3>
        <span className="text-xs text-muted">{entries.length} días</span>
      </div>

      {entries.length === 0 && (
        <div className="text-muted text-sm py-8 text-center">No hay notas de memoria aún</div>
      )}

      {entries.map(e => {
        const isToday = e.date === today
        const isExpanded = expanded === e.date
        const lines = (e.content || '').split('\n').filter(l => l.trim())
        const preview = lines.slice(0, 3).join('\n')
        const wordCount = (e.content || '').split(/\s+/).length

        return (
          <div key={e.date}
            className={`bg-surface border rounded-lg overflow-hidden transition-all ${
              isToday ? 'border-highlight/40' : 'border-card'
            }`}>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card/30 transition-all"
              onClick={() => setExpanded(isExpanded ? null : e.date)}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{isToday ? '📍' : '📄'}</span>
                <div>
                  <span className={`font-mono text-sm font-medium ${isToday ? 'text-highlight' : 'text-text'}`}>
                    {e.date}
                  </span>
                  {isToday && <span className="ml-2 text-[10px] bg-highlight/20 text-highlight px-1.5 py-0.5 rounded-full">hoy</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted">{wordCount} palabras</span>
                <button onClick={(ev) => { ev.stopPropagation(); onEditDay(e.date) }}
                  className="text-xs text-highlight hover:text-highlight/80 px-2 py-1 rounded hover:bg-highlight/10 transition-all">
                  ✏️ Editar
                </button>
                <span className="text-muted text-xs">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {!isExpanded && (
              <div className="px-4 pb-3 -mt-1">
                <pre className="text-xs text-muted/70 whitespace-pre-wrap line-clamp-3 font-sans">{preview}</pre>
              </div>
            )}

            {isExpanded && (
              <div className="border-t border-card/50 px-4 py-3 max-h-[60vh] overflow-auto">
                <pre className="text-xs text-muted whitespace-pre-wrap font-sans leading-relaxed">{e.content}</pre>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Config() {
  const [editing, setEditing] = useState(null)
  const [editingDay, setEditingDay] = useState(null)
  const [activeTab, setActiveTab] = useState('files')

  if (editing) return <FileEditor fileId={editing} onBack={() => setEditing(null)} />
  if (editingDay) return <MemoryDayEditor date={editingDay} onBack={() => setEditingDay(null)} />

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-2xl font-bold text-text mb-2">Configuration</h2>
      <p className="text-muted text-sm mb-6">Archivos del workspace y memoria</p>

      <div className="flex gap-1 mb-6">
        {[
          { id: 'files', label: '📄 Files' },
          { id: 'memory', label: '🧠 Memory' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm ${activeTab === t.id ? 'bg-highlight text-white' : 'text-muted hover:text-text bg-card'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'files' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FILES.map(f => (
            <button key={f.id} onClick={() => setEditing(f.id)}
              className="bg-surface border border-card rounded-lg p-4 text-left hover:border-highlight/40 transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h4 className="font-semibold text-text group-hover:text-highlight transition-all">{f.label}</h4>
                  <p className="text-xs text-muted">{f.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'memory' && <MemoryView onEditDay={(d) => setEditingDay(d)} />}
    </div>
  )
}
