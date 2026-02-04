export default function AgentCard({ agent, session, onSendMessage, onViewHistory }) {
  const isActive = session?.isActive || false
  const lastActive = session?.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'Never'
  const currentTask = session?.currentTask || 'Idle'

  const getStatusColor = () => {
    if (isActive) return 'text-green-400'
    if (session?.lastActivity) {
      const timeDiff = Date.now() - new Date(session.lastActivity).getTime()
      if (timeDiff < 300000) return 'text-yellow-400' // 5 minutes = idle
      return 'text-gray-400' // sleeping
    }
    return 'text-gray-400'
  }

  const getStatusText = () => {
    if (isActive) return 'Active'
    if (session?.lastActivity) {
      const timeDiff = Date.now() - new Date(session.lastActivity).getTime()
      if (timeDiff < 300000) return 'Idle'
      return 'Sleeping'
    }
    return 'Unknown'
  }

  return (
    <div className={`bg-card border border-accent rounded-lg p-6 transition-all hover:border-highlight ${
      isActive ? 'agent-active' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{agent.emoji}</span>
          <div>
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <p className="text-muted text-sm">{agent.role}</p>
          </div>
        </div>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <p className="text-sm mb-4 text-muted">{agent.description}</p>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Last Active:</span>
          <span>{lastActive}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Current Task:</span>
          <span className="text-right max-w-32 truncate" title={currentTask}>
            {currentTask}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Session:</span>
          <span className="text-xs font-mono">{agent.sessionKey}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSendMessage(agent)}
          className="flex-1 bg-accent hover:bg-highlight text-text text-sm py-2 px-3 rounded transition-all"
        >
          Send Message
        </button>
        <button
          onClick={() => onViewHistory(agent)}
          className="flex-1 bg-surface hover:bg-card text-text text-sm py-2 px-3 rounded border border-accent transition-all"
        >
          View History
        </button>
      </div>
    </div>
  )
}