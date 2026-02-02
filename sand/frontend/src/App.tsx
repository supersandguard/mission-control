import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SafeAppProvider, useSafeAppContext } from './context/SafeAppContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TxQueue from './pages/TxQueue'
import TxDetail from './pages/TxDetail'
import Settings from './pages/Settings'
import Layout from './components/Layout'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// When inside Safe, skip landing/login and go straight to dashboard
function SafeAwareRoute({ children }: { children: React.ReactNode }) {
  const { isSafeApp } = useSafeAppContext()
  const { isAuthenticated } = useAuth()
  
  if (isSafeApp && isAuthenticated) {
    return <Navigate to="/app" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages — skip if inside Safe App and authenticated */}
      <Route path="/" element={<SafeAwareRoute><Landing /></SafeAwareRoute>} />
      <Route path="/login" element={<SafeAwareRoute><Login /></SafeAwareRoute>} />

      {/* App pages — with Layout (header + bottom nav) and auth protection */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/queue" element={<TxQueue />} />
        <Route path="/app/tx/:id" element={<TxDetail />} />
        <Route path="/app/settings" element={<Settings />} />
      </Route>

      {/* Redirect any /app/* routes to /login if not authenticated */}
      <Route path="/app/*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAppProvider>
        <AppRoutes />
      </SafeAppProvider>
    </AuthProvider>
  )
}
