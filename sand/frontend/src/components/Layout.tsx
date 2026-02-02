import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, List, Settings } from 'lucide-react';
import { useSafeApp } from '../hooks/useSafeApp';
import type { ReactNode } from 'react';

const navItems: { to: string; icon: ReactNode; label: string; end: boolean }[] = [
  { to: '/app', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', end: true },
  { to: '/app/queue', icon: <List className="w-5 h-5" />, label: 'TX Queue', end: false },
  { to: '/app/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings', end: false },
];

export default function Layout() {
  const { isInsideIframe } = useSafeApp();

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950">
      {/* Header — hidden when embedded in Safe App iframe (Safe provides its own) */}
      {!isInsideIframe && (
        <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <span className="text-base font-semibold text-slate-100 tracking-tight">
                SandGuard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Ethereum</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={`flex-1 max-w-lg mx-auto w-full px-4 py-4 ${isInsideIframe ? '' : 'pb-24'}`}>
        <Outlet />
      </main>

      {/* Bottom Nav — hidden when embedded in Safe App iframe */}
      {!isInsideIframe && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/60">
          <div className="max-w-lg mx-auto flex items-center justify-around h-16">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`
                }
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
