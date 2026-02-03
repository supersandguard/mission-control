import { useState, useEffect, useRef } from 'react'

const API = '/api'
function api(url, opts = {}) {
  const token = localStorage.getItem('mc_token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...opts.headers }
  return fetch(API + url, { ...opts, headers }).then(r => r.json())
}

export default function Chat({ onUnread }) {
  const [text, setText] = useState('')
  const [prefs, setPrefs] = useState([])
  const [sending, setSending] = useState(false)
  const chatRef = useRef(null)
  const prevPendingRef = useRef(0)

  useEffect(() => { loadPrefs() }, [])

  // Poll for updates on pending items
  useEffect(() => {
    const id = setInterval(loadPrefs, 5000)
    return () => clearInterval(id)
  }, [])

  const loadPrefs = async () => {
    try {
      const d = await api('/preferences')
      const newPrefs = d.preferences || []
      setPrefs(prev => {
        // Check if any pending item just got resolved
        const prevPending = prev.filter(p => p.status === 'pending').length
        const newApplied = newPrefs.filter(p => p.status === 'applied').length
        const oldApplied = prev.filter(p => p.status === 'applied').length
        if (newApplied > oldApplied && onUnread) onUnread(true)
        return newPrefs
      })
    } catch (e) {}
  }

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await api('/preferences', { method: 'POST', body: JSON.stringify({ text: text.trim() }) })
      setText('')
      await loadPrefs()
      setTimeout(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }) }, 100)
    } catch (e) { alert('Error: ' + e.message) }
    setSending(false)
  }

  const clearAll = async () => {
    if (!confirm('Clear chat history?')) return
    for (const p of prefs) {
      await api(`/preferences/${p.id}`, { method: 'DELETE' })
    }
    setPrefs([])
  }

  const sorted = [...prefs].reverse()

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-card shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🖤</span>
          <div>
            <span className="text-sm font-semibold text-text">Max Umbra</span>
            <p className="text-xs text-muted">Configuration assistant</p>
          </div>
        </div>
        {prefs.length > 0 && (
          <button onClick={clearAll} className="text-xs text-muted hover:text-red-400">Clear</button>
        )}
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-auto p-4 space-y-3">
        {sorted.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">💬</span>
            <p className="text-sm text-muted">Tell me what you want to change.</p>
            <p className="text-xs text-muted mt-1">I'll figure out where it goes and apply it.</p>
            <div className="mt-4 space-y-1.5">
              {['Always number my lists', 'Be more concise', 'Check my email every 2 hours'].map(ex => (
                <button key={ex} onClick={() => setText(ex)}
                  className="block mx-auto text-xs bg-card hover:bg-accent text-muted hover:text-text px-3 py-1.5 rounded-full transition-all">
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        )}

        {sorted.map(p => (
          <div key={p.id}>
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-highlight/20 border border-highlight/10 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
                <p className="text-sm text-text">{p.text}</p>
                <span className="text-xs text-muted/50 block text-right mt-0.5">
                  {new Date(p.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Response */}
            {p.status === 'applied' && p.response ? (
              <div className="flex justify-start mt-2">
                <div className="bg-card border border-accent/30 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm text-text leading-relaxed">{p.response}</p>
                  {p.target && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xs text-highlight">📍 {p.target}</span>
                      {p.category && <span className="text-xs text-muted bg-surface px-1.5 py-0.5 rounded">{p.category}</span>}
                    </div>
                  )}
                </div>
              </div>
            ) : p.status === 'pending' ? (
              <div className="flex justify-start mt-2">
                <div className="bg-card/50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{animationDelay:'0.15s'}} />
                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{animationDelay:'0.3s'}} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="border-t border-card px-3 py-2 shrink-0 safe-area-bottom">
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Tell Max what you want..."
            disabled={sending}
            className="flex-1 bg-card rounded-full px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-highlight transition-all disabled:opacity-50" />
          <button onClick={send} disabled={!text.trim() || sending}
            className="bg-highlight hover:bg-highlight/90 text-white w-10 h-10 rounded-full text-sm font-bold disabled:opacity-30 transition-colors shrink-0 flex items-center justify-center">
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
