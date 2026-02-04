import { useState, useEffect } from 'react'
import { cronApi } from '../api'

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

export default function Activity({ sessions = [] }) {
  const [cronJobs, setCronJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('sessions')

  useEffect(() => {
    loadCron()
  }, [])

  const loadCron = async () => {
    try {
      const data = await cronApi.list()
      setCronJobs(data.jobs || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const sorted = [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text">Activity</h2>
        <div className="flex gap-1">
          {['sessions', 'cron'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-sm ${tab === t ? 'bg-highlight text-white' : 'text-muted hover:text-text bg-card'}`}>
              {t === 'sessions' ? '⚡ Sessions' : '⏰ Cron'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sessions' && (
        <div className="space-y-2">
          {sorted.map(s => {
            const active = s.updatedAt && (Date.now() - s.updatedAt) < 300000
            return (
              <div key={s.key} className="bg-surface border border-card rounded-lg p-4 hover:border-highlight/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    <div>
                      <span className="font-medium text-text">{sessionName(s)}</span>
                      <span className="text-xs text-muted ml-2 bg-card px-1.5 py-0.5 rounded">{s.kind}</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted">{timeAgo(s.updatedAt)}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted">
                  <span>Model: {(s.model||'?').replace('claude-','').replace('anthropic/','')}</span>
                  <span>Tokens: {s.totalTokens ? `${(s.totalTokens/1000).toFixed(1)}K` : '0'}</span>
                  <span className="font-mono text-[10px] opacity-60">{s.key}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'cron' && (
        <div className="space-y-3">
          {cronJobs.length === 0 && <div className="text-center text-muted py-12">No cron jobs</div>}
          {cronJobs.map(job => (
            <div key={job.id} className="bg-surface border border-card rounded-lg p-4 hover:border-highlight/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${job.enabled ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <h3 className="font-semibold text-text">{job.name || (job.id||'').slice(0,8)}</h3>
                  <span className="text-xs text-muted bg-card px-2 py-0.5 rounded font-mono">
                    {job.schedule?.expr || job.schedule?.kind || '?'}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${job.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {job.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {job.payload?.text && <p className="text-sm text-muted mb-3">{job.payload.text}</p>}
              <div className="flex gap-4 text-xs text-muted flex-wrap">
                <span>Target: <span className="text-text">{job.sessionTarget || '?'}</span></span>
                {job.state?.nextRunAtMs && <span>Next: <span className="text-text">{new Date(job.state.nextRunAtMs).toLocaleString()}</span></span>}
                {job.state?.lastStatus && <span>Last: <span className={job.state.lastStatus === 'ok' ? 'text-green-400' : 'text-red-400'}>{job.state.lastStatus}</span></span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
