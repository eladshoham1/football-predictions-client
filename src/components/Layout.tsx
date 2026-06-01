import React from 'react'
import { useAuth } from '../AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signout } = useAuth()
  const [currentPage, setCurrentPage] = React.useState(window.location.hash.slice(1) || 'home')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(window.location.hash.slice(1) || 'home')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-0">
      {/* Mobile Header - Simplified */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo - Compact for mobile */}
            <div className="flex items-center gap-2">
              <div className="text-2xl md:text-3xl">⚽</div>
              <div>
                <h1 className="text-base md:text-xl font-bold gradient-text">מונדיאל 2026</h1>
                <p className="text-xs text-slate-500 hidden md:block">ליגת הניחושים</p>
              </div>
            </div>

            {/* Profile Button - Mobile Only */}
            {user && (
              <a href="#profile" className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-primary-200"
                  />
                ) : (
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </a>
            )}

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <DesktopNavLink href="#home" active={currentPage === 'home'}>בית</DesktopNavLink>
              <DesktopNavLink href="#matches" active={currentPage === 'matches'}>משחקים</DesktopNavLink>
              <DesktopNavLink href="#groups" active={currentPage === 'groups'}>קבוצות</DesktopNavLink>
              <DesktopNavLink href="#bracket" active={currentPage === 'bracket'}>פלייאוף</DesktopNavLink>
              <DesktopNavLink href="#golden-boot" active={currentPage === 'golden-boot'}>מלך השערים</DesktopNavLink>
              <DesktopNavLink href="#leaderboard" active={currentPage === 'leaderboard'}>דירוג</DesktopNavLink>
              {user?.role === 'ADMIN' && (
                <DesktopNavLink href="#admin" active={currentPage === 'admin'}>ניהול</DesktopNavLink>
              )}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <a href="#profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {user.avatarUrl && (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full ring-2 ring-primary-200"
                      />
                    )}
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  </a>
                  <button onClick={signout} className="btn-ghost text-sm">
                    יציאה
                  </button>
                </>
              ) : (
                <a href={`${API_URL}/auth/google`} className="btn-primary text-sm">
                  התחברות עם Google
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
          <div className="grid grid-cols-5 h-16">
            <BottomNavItem href="#matches" icon="matches" label="משחקים" active={currentPage === 'matches'} />
            <BottomNavItem href="#groups" icon="groups" label="קבוצות" active={currentPage === 'groups'} />
            <BottomNavItem href="#bracket" icon="bracket" label="פלייאוף" active={currentPage === 'bracket'} />
            <BottomNavItem href="#golden-boot" icon="crown" label="מלך" active={currentPage === 'golden-boot'} />
            <BottomNavItem href="#leaderboard" icon="leaderboard" label="דירוג" active={currentPage === 'leaderboard'} />
          </div>
        </nav>
      )}

      {/* Footer - Desktop Only */}
      <footer className="hidden md:block bg-slate-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-slate-400">
              © 2026 ליגת ניחושי המונדיאל. כל הזכויות שמורות.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              תוכנן ופותח ע״י לה פמיליה ⚽
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BottomNavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  const icons = {
    home: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    matches: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    groups: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    bracket: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    crown: (
      <div className="text-2xl">👑</div>
    ),
    leaderboard: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    profile: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  }

  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${
        active
          ? 'text-primary-600'
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icons[icon as keyof typeof icons]}
      <span className="text-xs font-medium">{label}</span>
    </a>
  )
}

function DesktopNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </a>
  )
}
