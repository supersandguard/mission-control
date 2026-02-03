import { useState, useEffect } from 'react'

function StatusDot({ active }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const check = () => {
      // If viewport height is significantly less than window height, keyboard is open
      setVisible(window.innerHeight - vv.height > 100)
    }
    vv.addEventListener('resize', check)
    check() // Initial check
    return () => vv.removeEventListener('resize', check)
  }, [])
  return visible
}

export default function Layout({ children, currentPage, setCurrentPage, connected, sessionCount, chatUnread }) {
  const keyboardOpen = useKeyboardVisible()
  
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  currentPage === t.id 
                    ? 'bg-highlight text-white shadow-md' 
                    : 'text-muted hover:text-text hover:bg-card/50'
                }`}>
                <span className="mr-2 text-base">{t.icon}</span>
                {t.label}
                {t.badge && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-surface" />
                )}
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
      <header className="md:hidden bg-surface border-b border-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🖤</span>
          <h1 className="font-bold text-text">Mission Control</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{sessionCount || 0}</span>
          <StatusDot active={connected} />
          <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Mobile bottom nav - hide when keyboard is open */}
      <nav className={`
        md:hidden bg-surface/95 backdrop-blur border-t border-card/50 flex shrink-0 transition-all duration-200 ease-out
        ${keyboardOpen 
          ? 'transform translate-y-full opacity-0 pointer-events-none' 
          : 'transform translate-y-0 opacity-100'
        }
      `}
      style={{
        paddingBottom: `max(env(safe-area-inset-bottom, 0px), ${keyboardOpen ? '0px' : '8px'})`
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setCurrentPage(t.id)}
            className={`flex-1 flex flex-col items-center py-3 transition-all relative ${
              currentPage === t.id 
                ? 'text-highlight' 
                : 'text-muted/70 hover:text-muted active:text-text'
            }`}>
            <div className="relative flex items-center justify-center mb-1">
              <span className={`text-xl transition-transform ${
                currentPage === t.id ? 'scale-110' : 'scale-100'
              }`}>
                {t.icon}
              </span>
              {t.badge && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-surface" />
              )}
            </div>
            <span className={`text-[10px] font-medium leading-none transition-all ${
              currentPage === t.id 
                ? 'text-highlight' 
                : 'text-muted/60'
            }`}>
              {t.label}
            </span>
            {/* Active indicator */}
            {currentPage === t.id && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-highlight rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}