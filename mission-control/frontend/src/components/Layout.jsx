function StatusDot({ active }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
}

export default function Layout({ children, currentPage, setCurrentPage, connected, sessionCount }) {
  const tabs = [
    { id: 'control', label: 'Control', icon: '🎛️' },
    { id: 'sessions', label: 'Sessions', icon: '⚡' },
    { id: 'work', label: 'Work', icon: '📋' },
    { id: 'config', label: 'Config', icon: '⚙️' },
  ]
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖤</span>
            <h1 className="font-bold text-lg text-text tracking-tight">Mission Control</h1>
          </div>
          <nav className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setCurrentPage(t.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentPage === t.id ? 'bg-highlight text-white' : 'text-muted hover:text-text hover:bg-card'
                }`}>
                <span className="mr-1.5">{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{sessionCount || 0} sessions</span>
          <div className="flex items-center gap-1.5">
            <StatusDot active={connected} />
            <span className={connected ? 'text-green-400' : 'text-red-400'}>
              {connected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
