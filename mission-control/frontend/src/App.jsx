import { useState, useEffect, useCallback } from 'react'
import Layout from './components/Layout'
import Control from './pages/Control'
import Dashboard from './pages/Dashboard'
import TasksActivity from './pages/TasksActivity'
import Config from './pages/Config'
import { sessionsApi } from './api'

function Login({ onLogin }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      })
      if (r.ok) {
        localStorage.setItem('mc_token', token.trim())
        onLogin(token.trim())
      } else {
        setError('Invalid token')
      }
    } catch (e) { setError('Connection error') }
    setLoading(false)
  }

  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <form onSubmit={submit} className="bg-surface border border-card rounded-xl p-8 w-96 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-4xl">🖤</span>
          <h1 className="text-xl font-bold text-text mt-2">Mission Control</h1>
          <p className="text-sm text-muted mt-1">Enter access token</p>
        </div>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} autoFocus
          placeholder="Token..."
          className="w-full bg-card border border-accent rounded-lg px-4 py-3 text-sm text-text focus:outline-none focus:border-highlight mb-3" />
        {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
        <button type="submit" disabled={loading || !token.trim()}
          className="w-full bg-highlight hover:bg-highlight/80 disabled:opacity-40 text-white py-3 rounded-lg text-sm font-medium transition-all">
          {loading ? '...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

function App() {
  const [authed, setAuthed] = useState(null) // null = checking, true/false
  const [currentPage, setCurrentPage] = useState('control')
  const [sessions, setSessions] = useState([])
  const [connected, setConnected] = useState(false)

  // Check auth on load
  useEffect(() => {
    const saved = localStorage.getItem('mc_token')
    fetch('/api/auth/status', {
      headers: saved ? { 'Authorization': `Bearer ${saved}` } : {}
    }).then(r => r.json()).then(d => {
      if (!d.authRequired || d.authenticated) {
        setAuthed(true)
        window._mcToken = saved
      } else {
        setAuthed(false)
      }
    }).catch(() => setAuthed(false))
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const headers = {}
      const t = localStorage.getItem('mc_token')
      if (t) headers['Authorization'] = `Bearer ${t}`
      const r = await fetch('/api/sessions?limit=30', { headers })
      const data = await r.json()
      setSessions(data.sessions || [])
      setConnected(true)
    } catch (e) { setConnected(false) }
  }, [])

  useEffect(() => { if (authed) loadSessions() }, [authed])
  useEffect(() => {
    if (!authed) return
    const id = setInterval(loadSessions, 15000)
    return () => clearInterval(id)
  }, [authed, loadSessions])

  const handleLogin = (token) => {
    window._mcToken = token
    setAuthed(true)
  }

  if (authed === null) return <div className="h-screen bg-background flex items-center justify-center text-muted">Loading...</div>
  if (!authed) return <Login onLogin={handleLogin} />

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}
      connected={connected} sessionCount={sessions.length}>
      {currentPage === 'control' && <Control />}
      {currentPage === 'sessions' && <Dashboard sessions={sessions} onRefresh={loadSessions} />}
      {currentPage === 'work' && <TasksActivity sessions={sessions} />}
      {currentPage === 'config' && <Config />}
    </Layout>
  )
}

export default App
