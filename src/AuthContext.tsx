import React, { createContext, useContext, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMe, setToken as apiSetToken } from './api'
import type { User } from './types'

type AuthContextValue = {
  token: string | null
  user: User | null
  signin: (token: string) => void
  signout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // On mount, check URL for ?token=... (from OAuth callback)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    if (tokenFromUrl) {
      localStorage.setItem('fp_token', tokenFromUrl)
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname)
      window.location.reload() // Reload to apply new token
    }
  }, [])

  const token = typeof window !== 'undefined' ? localStorage.getItem('fp_token') : null
  apiSetToken(token)

  const { data: user } = useQuery<User | null>({ queryKey: ['me'], queryFn: getMe, enabled: !!token, retry: false })

  const value = useMemo(() => ({
    token,
    user: user ?? null,
    signin(t: string) { localStorage.setItem('fp_token', t); apiSetToken(t); window.location.reload() },
    signout() { localStorage.removeItem('fp_token'); apiSetToken(null); window.location.reload() }
  }), [token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
