import { useState, useEffect, useRef } from 'react'

const API = '/api'
function api(url, opts = {}) {
  const token = localStorage.getItem('mc_token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...opts.headers }
  return fetch(API + url, { ...opts, headers }).then(r => r.json())
}

export default function Chat({ onUnread, onBack }) {
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
      <div ref={chatRef} className="flex-1 overflow-auto px-4 py-3">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 -mt-8">
            <div className="flex flex-col items-center max-w-sm">
              <span className="text-4xl mb-3 opacity-60">💬</span>
              <p className="text-base font-semibold text-text mb-2">¿Qué quieres cambiar?</p>
              <p className="text-sm text-muted leading-relaxed mb-6">
                Dime en lenguaje normal qué comportamiento quieres que tenga y yo lo aplico.
              </p>
              <div className="space-y-3 w-full">
                {['Enumera siempre las listas', 'Sé más conciso en respuestas', 'Revisa mi email cada 2 horas'].map(ex => (
                  <button key={ex} onClick={() => setText(ex)}
                    className="block w-full text-sm bg-card/50 hover:bg-card text-muted hover:text-text px-4 py-3 rounded-2xl transition-all border border-card/30 hover:border-accent/30">
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto pb-4">
            {sorted.map(p => (
              <div key={p.id} className="space-y-2">
                {/* User bubble (right aligned) */}
                <div className="flex justify-end">
                  <div className="bg-highlight/90 rounded-[18px] rounded-br-md px-4 py-2.5 max-w-[85%] shadow-sm">
                    <p className="text-[14px] text-white leading-[1.4] font-medium">{p.text}</p>
                    <span className="text-[11px] text-white/70 block text-right mt-1 leading-none">
                      {new Date(p.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Response bubble (left aligned) */}
                {p.status === 'applied' && p.response ? (
                  <div className="flex justify-start">
                    <div className="bg-card rounded-[18px] rounded-bl-md px-4 py-2.5 max-w-[85%] shadow-sm border border-card/50">
                      <p className="text-[14px] text-text leading-[1.4]">{p.response}</p>
                      {(p.target || p.category) && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {p.target && <span className="text-[11px] text-highlight font-medium">→ {p.target}</span>}
                          {p.category && <span className="text-[10px] text-muted/70 bg-surface px-2 py-1 rounded-full">{p.category}</span>}
                        </div>
                      )}
                      <span className="text-[11px] text-muted/60 block text-left mt-1 leading-none">
                        {new Date(p.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ) : p.status === 'pending' ? (
                  <div className="flex justify-start">
                    <div className="bg-card/70 rounded-[18px] rounded-bl-md px-4 py-3 border border-card/30">
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
      <div className="border-t border-card/30 px-4 py-3 shrink-0 bg-surface/80 backdrop-blur-sm safe-area-bottom">
        <div className="flex gap-3 items-end max-w-md mx-auto">
          {prefs.length > 0 && (
            <button onClick={clearAll} 
              className="text-muted hover:text-red-400 pb-3 text-sm shrink-0 transition-colors">
              🗑️
            </button>
          )}
          <div className="flex-1 relative">
            <input ref={inputRef} 
              value={text} 
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Escribe algo..."
              disabled={sending}
              className="w-full bg-card rounded-[22px] px-4 py-3 text-[14px] text-text placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-highlight/40 transition-all disabled:opacity-50 border border-card/50 focus:border-highlight/50" />
          </div>
          <button onClick={send} 
            disabled={!text.trim() || sending}
            className="bg-highlight hover:bg-highlight/90 disabled:bg-muted/20 text-white w-10 h-10 rounded-full text-lg font-bold disabled:opacity-30 transition-all shrink-0 flex items-center justify-center mb-0.5 shadow-sm disabled:shadow-none">
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}