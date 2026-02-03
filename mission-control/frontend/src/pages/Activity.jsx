import { useState, useEffect } from 'react'
import { sessionsApi, agentsApi, cronApi } from '../api'
import ActivityItem from '../components/ActivityItem'

export default function Activity() {
  const [activities, setActivities] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadActivityData()
    const interval = setInterval(loadActivityData, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadActivityData = async () => {
    try {
      const [sessionsData, agentsData, cronData] = await Promise.all([
        sessionsApi.list({ limit: 50, activeMinutes: 1440 }), // Last 24 hours
        agentsApi.list(),
        cronApi.list().catch(() => ({ jobs: [] })) // Graceful fail for cron
      ])

      const agentMap = {}
      agentsData.agents.forEach(agent => {
        agentMap[agent.sessionKey] = agent
        agentMap[agent.id] = agent
      })
      
      setAgents(agentsData.agents || [])

      // Convert sessions and cron jobs to activity items
      const sessionActivities = (sessionsData.sessions || []).map(session => ({
        id: `session-${session.key}`,
        timestamp: session.lastActivity || session.createdAt,
        agentId: agentMap[session.key]?.id || 'unknown',
        description: `Session ${session.isActive ? 'active' : 'idle'}: ${session.label || session.key}`,
        details: `Messages: ${session.messageCount || 0} | Model: ${session.model || 'unknown'}`
      }))

      const cronActivities = (cronData.jobs || []).map(job => ({
        id: `cron-${job.id}`,
        timestamp: job.lastRun || job.createdAt,
        agentId: 'system',
        description: `Cron job: ${job.label || job.id}`,
        details: `Schedule: ${job.schedule} | Status: ${job.enabled ? 'enabled' : 'disabled'}`
      }))

      // Combine and sort by timestamp
      const allActivities = [...sessionActivities, ...cronActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setActivities(allActivities)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (!filter) return true
    const agent = agents.find(a => a.id === activity.agentId)
    return agent?.name.toLowerCase().includes(filter.toLowerCase()) ||
           activity.description.toLowerCase().includes(filter.toLowerCase())
  })

  const getAgentForActivity = (activity) => {
    if (activity.agentId === 'system') {
      return { id: 'system', name: 'System', emoji: '⚙️', color: '#888888' }
    }
    return agents.find(a => a.id === activity.agentId) || 
           { id: 'unknown', name: 'Unknown Agent', emoji: '❓', color: '#888888' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Loading activity...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-300 font-semibold">Error loading activity</h3>
        <p className="text-red-400 text-sm mt-1">{error}</p>
        <button 
          onClick={loadActivityData}
          className="mt-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Activity</h1>
            <p className="text-muted">{activities.length} activities in the last 24 hours</p>
          </div>
          <button
            onClick={loadActivityData}
            className="bg-accent hover:bg-highlight text-white px-4 py-2 rounded transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filter */}
        <input
          type="text"
          placeholder="Filter activities..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md bg-card border border-accent rounded px-3 py-2 text-text"
        />
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              agent={getAgentForActivity(activity)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">No activity found</h3>
            <p className="text-muted">
              {filter ? 'Try adjusting your filter' : 'System activity will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}