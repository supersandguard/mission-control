import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TxQueue from './pages/TxQueue'
import TxDetail from './pages/TxDetail'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              SandGuard
            </h1>
          </div>
          <span className="text-xs text-slate-500">v0.1</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/queue" element={<TxQueue />} />
          <Route path="/tx/:id" element={<TxDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-800 z-50">
        <div className="max-w-lg mx-auto flex">
          {[
            { to: '/', icon: '📊', label: 'Dashboard' },
            { to: '/queue', icon: '📋', label: 'Cola TX' },
            { to: '/settings', icon: '⚙️', label: 'Config' },
          ].map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
