import TaskCard from './TaskCard'

export default function TaskColumn({ status, tasks, agents, onTaskMove, onTaskEdit }) {
  const statusLabels = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done'
  }

  const statusColors = {
    backlog: 'border-gray-500',
    in_progress: 'border-blue-500',
    review: 'border-yellow-500',
    done: 'border-green-500'
  }

  const filteredTasks = tasks.filter(task => task.status === status)

  return (
    <div className="flex flex-col h-full">
      <div className={`border-b-2 ${statusColors[status]} pb-2 mb-4`}>
        <h3 className="font-semibold text-lg">{statusLabels[status]}</h3>
        <span className="text-muted text-sm">{filteredTasks.length} tasks</span>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1">
        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            agents={agents}
            onTaskMove={onTaskMove}
            onTaskEdit={onTaskEdit}
          />
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="text-center text-muted py-8">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm">No tasks in {statusLabels[status].toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  )
}