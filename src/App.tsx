import React, { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/Landing'
import Matches from './pages/Matches'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import GroupStage from './pages/GroupStage'
import Bracket from './pages/Bracket'
import GoldenBoot from './pages/GoldenBoot'

function Router() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home'
      setCurrentPage(hash)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (!user) {
    return <LandingPage />
  }

  return (
    <Layout>
      {currentPage === 'home' && <Dashboard />}
      {currentPage === 'matches' && <Matches />}
      {currentPage === 'groups' && <GroupStage />}
      {currentPage === 'bracket' && <BracketPage />}
      {currentPage === 'golden-boot' && <GoldenBoot />}
      {currentPage === 'leaderboard' && <Leaderboard />}
      {currentPage === 'profile' && <Profile />}
      {currentPage === 'admin' && user.role === 'ADMIN' && <AdminPage />}
    </Layout>
  )
}

function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black gradient-text">ברוכים הבאים למונדיאל 2026!</h1>
        <p className="text-lg text-slate-600">
          בצעו את הניחושים שלכם והתחרו עם חברים
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon="⚽" label={'סה"כ משחקים'} value="104" />
        <StatCard icon="🎯" label="הניחושים שלך" value="0" />
        <StatCard icon="📊" label={'סה"כ נקודות'} value="0" />
        <StatCard icon="🏆" label="הדירוג שלך" value="-" />
      </div>

      {/* Quick Actions */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-slate-800">פעולות מהירות</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <QuickAction
            href="#matches"
            icon="⚽"
            title="ניחושי משחקים"
            description="נחשו תוצאות למשחקים הקרובים"
          />
          <QuickAction
            href="#groups"
            icon="👥"
            title="שלב הקבוצות"
            description="בחרו קבוצות שיעפילו לשלב ההדחות"
          />
          <QuickAction
            href="#bracket"
            icon="🏆"
            title="שלב הנוקאוט"
            description="ניחושי מנצחים בשלב ההדחות"
          />
          <QuickAction
            href="#golden-boot"
            icon="👑"
            title="מלך השערים"
            description="נחשו מי יהיה מלך השערים"
          />
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">שחקנים מובילים</h2>
          <a href="#leaderboard" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            ללוח המלא ←
          </a>
        </div>
        <Leaderboard limit={5} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="stat-card space-y-2">
      <div className="text-3xl">{icon}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  )
}

function QuickAction({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <a
      href={href}
      className="card-flat hover:shadow-lg hover:border-primary-300 transition-all duration-200 space-y-3 block"
    >
      <div className="text-4xl">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </a>
  )
}

function BracketPage() {
  return <Bracket />
}

function AdminPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-black gradient-text">פאנל ניהול</h1>
      <div className="card">
        <p className="text-slate-600">תכונות ניהול בקרוב...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
