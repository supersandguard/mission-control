import { useState, useEffect } from 'react'
import { tasksApi, agentsApi } from '../api'
import TaskColumn from '../components/TaskColumn'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: ''
  })
  const [filter, setFilter] = useState({ agent: '', priority: '' })

  useEffect(() => {
    loadTasksData()
    const interval = setInterval(loadTasksData, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadTasksData = async () => {
    try {
      const [tasksData, agentsData] = await Promise.all([
        tasksApi.list(),
        agentsApi.list()
      ])
      
      setTasks(tasksData.tasks || [])
      setAgents(agentsData.agents || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskMove = async (taskId, newStatus) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      )
      
      setTasks(updatedTasks)
      await tasksApi.update({ tasks: updatedTasks, nextId: Math.max(...updatedTasks.map(t => t.id)) + 1 })
    } catch (err) {
      console.error('Failed to move task:', err)
      loadTasksData() // Reload on error
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return

    try {
      const task = await tasksApi.create({
        ...newTask,
        assignedTo: newTask.assignedTo || null
      })
      
      setTasks(prev => [...prev, task])
      setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '' })
      setShowAddTask(false)
    } catch (err) {
      alert(`Failed to create task: ${err.message}`)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter.agent && task.assignedTo !== filter.agent) return false
    if (filter.priority && task.priority !== filter.priority) return false
    return true
  })

  const statuses = ['backlog', 'in_progress', 'review', 'done']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Loading tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-300 font-semibold">Error loading tasks</h3>
        <p className="text-red-400 text-sm mt-1">{error}</p>
        <button 
          onClick={loadTasksData}
          className="mt-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Task Board</h1>
            <p className="text-muted">{tasks.length} total tasks</p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-highlight hover:bg-highlight/80 text-white px-4 py-2 rounded transition-all"
          >
            + Add Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filter.agent}
            onChange={(e) => setFilter(prev => ({ ...prev, agent: e.target.value }))}
            className="bg-card border border-accent rounded px-3 py-2 text-text"
          >
            <option value="">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.emoji} {agent.name}
              </option>
            ))}
          </select>

          <select
            value={filter.priority}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
            className="bg-card border border-accent rounded px-3 py-2 text-text"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-4 gap-6 overflow-hidden">
        {statuses.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={filteredTasks}
            agents={agents}
            onTaskMove={handleTaskMove}
          />
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-card rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-card border border-accent rounded p-3 text-text"
              />
              
              <textarea
                placeholder="Task description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-card border border-accent rounded p-3 text-text h-24 resize-none"
              />
              
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full bg-card border border-accent rounded p-3 text-text"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
              
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full bg-card border border-accent rounded p-3 text-text"
              >
                <option value="">Unassigned</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.emoji} {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddTask}
                disabled={!newTask.title.trim()}
                className="flex-1 bg-highlight hover:bg-highlight/80 disabled:bg-accent disabled:opacity-50 text-white py-2 rounded transition-all"
              >
                Create Task
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false)
                  setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '' })
                }}
                className="px-4 py-2 bg-surface border border-accent rounded hover:bg-card transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}