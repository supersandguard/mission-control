import { useState, useEffect } from 'react'
import { agentsApi, sessionsApi } from '../api'
import AgentCard from '../components/AgentCard'

export default function Dashboard() {
  const [agents, setAgents] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [history, setHistory] = useState([])
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 15000) // Poll every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [agentsData, sessionsData] = await Promise.all([
        agentsApi.list(),
        sessionsApi.list({ limit: 20, activeMinutes: 1440 }) // Last 24 hours
      ])
      
      setAgents(agentsData.agents || [])
      setSessions(sessionsData.sessions || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = (agent) => {
    setSelectedAgent(agent)
    setMessageText('')
    setShowMessageModal(true)
  }

  const handleViewHistory = async (agent) => {
    setSelectedAgent(agent)
    setShowHistoryModal(true)
    try {
      const historyData = await sessionsApi.getHistory(agent.sessionKey, { limit: 50 })
      setHistory(historyData.messages || [])
    } catch (err) {
      console.error('Failed to load history:', err)
      setHistory([])
    }
  }

  const submitMessage = async () => {
    if (!messageText.trim() || !selectedAgent) return
    
    setSendingMessage(true)
    try {
      await sessionsApi.sendMessage(selectedAgent.sessionKey, messageText)
      setShowMessageModal(false)
      setMessageText('')
      // Refresh dashboard data to see updated activity
      loadDashboardData()
    } catch (err) {
      alert(`Failed to send message: ${err.message}`)
    } finally {
      setSendingMessage(false)
    }
  }

  const getSessionForAgent = (agent) => {
    return sessions.find(s => s.key === agent.sessionKey)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-300 font-semibold">Error loading dashboard</h3>
        <p className="text-red-400 text-sm mt-1">{error}</p>
        <button 
          onClick={loadDashboardData}
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
        <h1 className="text-3xl font-bold mb-2">Mission Control Dashboard</h1>
        <p className="text-muted">Managing {agents.length} agent{agents.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            session={getSessionForAgent(agent)}
            onSendMessage={handleSendMessage}
            onViewHistory={handleViewHistory}
          />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">No agents configured</h3>
          <p className="text-muted">Add agents to your system to see them here.</p>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-card rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Send Message to {selectedAgent?.name}
            </h3>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter your message..."
              className="w-full bg-card border border-accent rounded p-3 text-text h-32 resize-none"
              disabled={sendingMessage}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={submitMessage}
                disabled={!messageText.trim() || sendingMessage}
                className="flex-1 bg-highlight hover:bg-highlight/80 disabled:bg-accent disabled:opacity-50 text-white py-2 rounded transition-all"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={() => setShowMessageModal(false)}
                disabled={sendingMessage}
                className="px-4 py-2 bg-surface border border-accent rounded hover:bg-card transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-card rounded-lg p-6 w-4/5 h-4/5">
            <h3 className="text-lg font-semibold mb-4">
              {selectedAgent?.name} Session History
            </h3>
            <div className="bg-card rounded p-4 h-full overflow-y-auto font-mono text-sm">
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((msg, idx) => (
                    <div key={idx} className="border-b border-accent pb-2">
                      <div className="text-muted text-xs">
                        {new Date(msg.timestamp).toLocaleString()}
                      </div>
                      <div className="mt-1">{msg.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-8">No messages found</div>
              )}
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="mt-4 px-4 py-2 bg-accent hover:bg-highlight rounded transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}