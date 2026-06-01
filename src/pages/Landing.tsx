import React, { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function LandingPage() {
  // World Cup 2026 starts June 11, 2026
  const tournamentStart = new Date('2026-06-11T00:00:00Z')
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())

  function calculateTimeLeft(): TimeLeft {
    const now = new Date()
    const difference = tournamentStart.getTime() - now.getTime()

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="text-7xl mb-4 animate-pulse-slow">⚽</div>
          <h1 className="text-5xl md:text-7xl font-black gradient-text">
            מונדיאל 2026
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-slate-700">
            ליגת הניחושים
          </p>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            הצטרפו למשחק הניחושים המושלם למונדיאל 2026! התחרו עם חברים,
            נחשו תוצאות משחקים, מנצחות קבוצות ותוצאות הטורניר.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">הטורניר מתחיל בעוד:</h2>
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <CountdownBox value={timeLeft.days} label="ימים" />
            <CountdownBox value={timeLeft.hours} label="שעות" />
            <CountdownBox value={timeLeft.minutes} label="דקות" />
            <CountdownBox value={timeLeft.seconds} label="שניות" />
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8">
          <a
            href={`${API_URL}/auth/google`}
            className="inline-flex items-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-2xl shadow-primary-300 hover:shadow-primary-400 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            התחבר עם Google להתחלה
          </a>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 pt-12 max-w-4xl mx-auto">
          <FeatureCard
            icon="🎯"
            title="ניחושי משחקים"
            description="נחשו תוצאות ל-104 משחקים וצברו נקודות על דיוק"
          />
          <FeatureCard
            icon="🏆"
            title="מנצח הטורניר"
            description="בחרו את האלופה ומלך השערים לנקודות בונוס"
          />
          <FeatureCard
            icon="📊"
            title="לוח מובילים חי"
            description="התחרו בזמן אמת ועקבו אחר הדירוג לאורך הטורניר"
          />
        </div>
      </div>
    </div>
  )
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="card-flat text-center">
      <div className="text-4xl md:text-5xl font-black gradient-text mb-2">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card text-center space-y-3 hover:scale-105 transition-transform">
      <div className="text-4xl">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}
