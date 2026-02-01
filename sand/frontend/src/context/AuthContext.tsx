import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  apiKey: string | null
  safeAddress: string | null
  isDemoMode: boolean
  login: (apiKey: string, safeAddress: string) => void
  logout: () => void
  setDemoMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [safeAddress, setSafeAddress] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('sand-auth')
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth)
        if (auth.apiKey || auth.isDemoMode) {
          setApiKey(auth.apiKey || null)
          setSafeAddress(auth.safeAddress || null)
          setIsDemoMode(auth.isDemoMode || false)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Failed to parse auth from localStorage:', error)
        localStorage.removeItem('sand-auth')
      }
    }
  }, [])

  const login = (apiKey: string, safeAddress: string) => {
    const auth = {
      apiKey,
      safeAddress,
      isDemoMode: false,
      timestamp: Date.now()
    }
    
    localStorage.setItem('sand-auth', JSON.stringify(auth))
    setApiKey(apiKey)
    setSafeAddress(safeAddress)
    setIsDemoMode(false)
    setIsAuthenticated(true)
  }

  const setDemoMode = () => {
    const auth = {
      apiKey: null,
      safeAddress: null,
      isDemoMode: true,
      timestamp: Date.now()
    }
    
    localStorage.setItem('sand-auth', JSON.stringify(auth))
    setApiKey(null)
    setSafeAddress(null)
    setIsDemoMode(true)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('sand-auth')
    setApiKey(null)
    setSafeAddress(null)
    setIsDemoMode(false)
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    apiKey,
    safeAddress,
    isDemoMode,
    login,
    logout,
    setDemoMode
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}