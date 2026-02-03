import { useState, useEffect } from 'react'

function authHeaders() {
  const token = localStorage.getItem('mc_token')
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const FILES = [
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

  useEffect(() => {
    loadFile()
  }, [fileId])

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
        method: 'PUT',
        headers: authHeaders(),
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

function MemoryView() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMemory()
  }, [])

  const loadMemory = async () => {
    try {
      const r = await fetch('/api/memory/recent', { headers: authHeaders() })
      const data = await r.json()
      setEntries(data.entries || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return <div className="text-center text-muted py-8">Loading...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text">📝 Recent Memory</h3>
      {entries.length === 0 && <div className="text-muted text-sm">No memory files found</div>}
      {entries.map(e => (
        <div key={e.date} className="bg-surface border border-card rounded-lg p-4">
          <h4 className="font-mono text-sm text-highlight mb-2">{e.date}</h4>
          <pre className="text-xs text-muted whitespace-pre-wrap overflow-hidden max-h-40">{e.content}</pre>
        </div>
      ))}
    </div>
  )
}

export default function Config() {
  const [editing, setEditing] = useState(null)
  const [activeTab, setActiveTab] = useState('files')

  if (editing) {
    return <FileEditor fileId={editing} onBack={() => setEditing(null)} />
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-2xl font-bold text-text mb-2">Configuration</h2>
      <p className="text-muted text-sm mb-6">Edit workspace files and view system state</p>

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

      {activeTab === 'memory' && <MemoryView />}
    </div>
  )
}
