function StatusDot({ active }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
}

export default function Layout({ children, currentPage, setCurrentPage, connected, sessionCount, chatUnread }) {
  const tabs = [
    { id: 'control', label: 'Control', icon: '🎛️' },
    { id: 'chat', label: 'Chat', icon: '💬', badge: chatUnread },
    { id: 'sessions', label: 'Sessions', icon: '⚡' },
    { id: 'work', label: 'Work', icon: '📋' },
    { id: 'config', label: 'Config', icon: '⚙️' },
  ]
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Desktop header */}
      <header className="hidden md:flex bg-surface border-b border-card px-4 py-3 items-center justify-between shrink-0">
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

      {/* Mobile header (compact) */}
      <header className="md:hidden bg-surface border-b border-card px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span>🖤</span>
          <h1 className="font-bold text-text text-sm">MC</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot active={connected} />
          <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? 'Online' : 'Off'}
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden bg-surface border-t border-card flex shrink-0 safe-area-bottom">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setCurrentPage(t.id)}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-all relative ${
              currentPage === t.id ? 'text-highlight' : 'text-muted'
            }`}>
            <span className="text-lg mb-0.5 relative">
              {t.icon}
              {t.badge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-background" />}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
