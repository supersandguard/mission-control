export default function ActivityItem({ activity, agent }) {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="flex items-start space-x-3 p-4 bg-surface rounded-lg border border-card hover:border-accent transition-all">
      <div className="flex-shrink-0">
        <span className="text-lg">{agent?.emoji || '🤖'}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span 
            className="font-medium text-sm"
            style={{ color: agent?.color || '#e94560' }}
          >
            {agent?.name || 'Unknown Agent'}
          </span>
          <div className="text-xs text-muted">
            {formatDate(activity.timestamp)} {formatTime(activity.timestamp)}
          </div>
        </div>
        
        <p className="text-sm text-text break-words">{activity.description}</p>
        
        {activity.details && (
          <div className="mt-2 text-xs text-muted bg-card p-2 rounded font-mono">
            {activity.details}
          </div>
        )}
      </div>
    </div>
  )
}