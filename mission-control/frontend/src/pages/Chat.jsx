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
  const inputRef = useRef(null)

  useEffect(() => { loadPrefs() }, [])

  // Poll for updates
  useEffect(() => {
    const id = setInterval(async () => {
      const d = await api('/preferences').catch(() => ({}))
      const newPrefs = d.preferences || []
      setPrefs(prev => {
        const oldApplied = prev.filter(p => p.status === 'applied').length
        const newApplied = newPrefs.filter(p => p.status === 'applied').length
        if (newApplied > oldApplied && onUnread) onUnread(true)
        return newPrefs
      })
    }, 5000)
    return () => clearInterval(id)
  }, [onUnread])

  const loadPrefs = async () => {
    try {
      const d = await api('/preferences')
      setPrefs(d.preferences || [])
      setTimeout(scrollBottom, 100)
    } catch (e) {}
  }

  const scrollBottom = () => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }

  const send = async () => {
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)
    try {
      await api('/preferences', { method: 'POST', body: JSON.stringify({ text: msg }) })
      await loadPrefs()
      setTimeout(scrollBottom, 150)
    } catch (e) { alert('Error: ' + e.message) }
    setSending(false)
    inputRef.current?.focus()
  }

  const clearAll = async () => {
    if (!confirm('¿Borrar historial?')) return
    for (const p of prefs) await api(`/preferences/${p.id}`, { method: 'DELETE' })
    setPrefs([])
  }

  // Show oldest first
  const sorted = [...prefs].reverse()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Messages area */}
      <div ref={chatRef} className="flex-1 overflow-auto px-3 py-4">
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-3xl block mb-2">💬</span>
            <p className="text-sm text-text font-medium">¿Qué quieres cambiar?</p>
            <p className="text-xs text-muted mt-1 mb-4">Dime en lenguaje normal y yo lo aplico.</p>
            <div className="space-y-2">
              {['Enumera siempre las listas', 'Sé más conciso', 'Revisa mi email cada 2 horas'].map(ex => (
                <button key={ex} onClick={() => setText(ex)}
                  className="block mx-auto text-xs bg-card hover:bg-accent text-muted hover:text-text px-4 py-2 rounded-full transition-all">
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-lg mx-auto">
            {sorted.map(p => (
              <div key={p.id}>
                {/* User bubble */}
                <div className="flex justify-end">
                  <div className="bg-highlight/25 rounded-2xl rounded-br-md px-3.5 py-2 max-w-[75%]">
                    <p className="text-[13px] text-text leading-snug">{p.text}</p>
                    <span className="text-[10px] text-muted/40 block text-right mt-0.5">
                      {new Date(p.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Response bubble */}
                {p.status === 'applied' && p.response ? (
                  <div className="flex justify-start mt-1.5">
                    <div className="bg-card rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[75%]">
                      <p className="text-[13px] text-text leading-snug">{p.response}</p>
                      {(p.target || p.category) && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {p.target && <span className="text-[10px] text-highlight">→ {p.target}</span>}
                          {p.category && <span className="text-[10px] text-muted/60 bg-surface px-1.5 py-0.5 rounded">{p.category}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : p.status === 'pending' ? (
                  <div className="flex justify-start mt-1.5">
                    <div className="bg-card/60 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce" style={{animationDelay:'0.15s'}} />
                        <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce" style={{animationDelay:'0.3s'}} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-card/50 px-3 py-2 shrink-0 safe-area-bottom bg-surface">
        <div className="flex gap-2 items-end max-w-lg mx-auto">
          {prefs.length > 0 && (
            <button onClick={clearAll} className="text-muted hover:text-red-400 pb-2.5 text-xs shrink-0">🗑</button>
          )}
          <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Escribe algo..."
            disabled={sending}
            className="flex-1 bg-card rounded-full px-4 py-2.5 text-sm text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-highlight/50 transition-all disabled:opacity-50" />
          <button onClick={send} disabled={!text.trim() || sending}
            className="bg-highlight hover:bg-highlight/90 text-white w-9 h-9 rounded-full text-sm font-bold disabled:opacity-20 transition-all shrink-0 flex items-center justify-center mb-0.5">
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
