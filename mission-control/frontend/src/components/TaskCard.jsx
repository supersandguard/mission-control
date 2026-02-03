export default function TaskCard({ task, agents, onTaskMove, onTaskEdit }) {
  const agent = agents.find(a => a.id === task.assignedTo)
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent': return 'border-l-red-500'
      case 'high': return 'border-l-orange-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-blue-500'
      default: return 'border-l-gray-500'
    }
  }

  const getPriorityBadge = () => {
    const colors = {
      urgent: 'bg-red-500/20 text-red-300',
      high: 'bg-orange-500/20 text-orange-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      low: 'bg-blue-500/20 text-blue-300'
    }
    return colors[task.priority] || colors.medium
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`bg-surface border-l-4 ${getPriorityColor()} p-4 rounded-r-lg shadow-sm hover:shadow-md transition-all cursor-pointer`}
         onClick={() => onTaskEdit?.(task)}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
        <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge()}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-muted text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center">
          {agent && (
            <span className="bg-card px-2 py-1 rounded mr-2" style={{ color: agent.color }}>
              {agent.emoji} {agent.name}
            </span>
          )}
        </div>
        <span className="text-muted">{formatDate(task.createdAt)}</span>
      </div>

      <div className="mt-3 flex gap-1">
        {['backlog', 'in_progress', 'review', 'done'].map(status => (
          <button
            key={status}
            onClick={(e) => {
              e.stopPropagation()
              onTaskMove(task.id, status)
            }}
            className={`text-xs px-2 py-1 rounded transition-all ${
              task.status === status 
                ? 'bg-highlight text-white' 
                : 'bg-card hover:bg-accent text-muted hover:text-text'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}