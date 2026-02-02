import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  apiKey: string | null
  safeAddress: string | null
  isGuestMode: boolean
  login: (apiKey: string, safeAddress: string) => void
  logout: () => void
  setGuestMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [safeAddress, setSafeAddress] = useState<string | null>(null)
  const [isGuestMode, setIsGuestMode] = useState(false)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('sand-auth')
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth)
        // Support both old 'isDemoMode' and new 'isGuestMode' keys for backwards compat
        const guest = auth.isGuestMode || auth.isDemoMode || false
        if (auth.apiKey || guest) {
          setApiKey(auth.apiKey || null)
          setSafeAddress(auth.safeAddress || null)
          setIsGuestMode(guest)
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
      isGuestMode: false,
      timestamp: Date.now()
    }
    
    localStorage.setItem('sand-auth', JSON.stringify(auth))
    setApiKey(apiKey)
    setSafeAddress(safeAddress)
    setIsGuestMode(false)
    setIsAuthenticated(true)
  }

  const setGuestMode = () => {
    const auth = {
      apiKey: null,
      safeAddress: null,
      isGuestMode: true,
      timestamp: Date.now()
    }
    
    localStorage.setItem('sand-auth', JSON.stringify(auth))
    setApiKey(null)
    setSafeAddress(null)
    setIsGuestMode(true)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('sand-auth')
    setApiKey(null)
    setSafeAddress(null)
    setIsGuestMode(false)
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    apiKey,
    safeAddress,
    isGuestMode,
    login,
    logout,
    setGuestMode
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
