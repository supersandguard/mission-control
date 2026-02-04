export default function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'activity', label: 'Activity', icon: '📈' },
  ]

  return (
    <aside className="w-64 bg-surface border-r border-card">
      <div className="p-6">
        <h1 className="text-xl font-bold text-highlight">Mission Control</h1>
        <p className="text-muted text-sm mt-1">Clawdbot Multi-Agent</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left transition-all hover:bg-card ${
              currentPage === item.id 
                ? 'bg-card border-r-2 border-highlight text-highlight' 
                : 'text-text hover:text-highlight'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-6 left-6 text-muted text-xs">
        <div>Node: clawdbot</div>
        <div>Gateway: :18789</div>
      </div>
    </aside>
  )
}