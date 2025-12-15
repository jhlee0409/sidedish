'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import LandingPage from '@/components/LandingPage'
import Dashboard from '@/components/Dashboard'

type ViewState = 'LANDING' | 'DASHBOARD'

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>('LANDING')

  const handleStart = () => {
    setCurrentView('DASHBOARD')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogoClick = () => {
    if (currentView === 'LANDING') {
      setCurrentView('DASHBOARD')
    } else {
      setCurrentView('LANDING')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Layout
      onLogoClick={handleLogoClick}
      isLanding={currentView === 'LANDING'}
    >
      {currentView === 'LANDING' ? (
        <LandingPage onStartClick={handleStart} />
      ) : (
        <Dashboard />
      )}
    </Layout>
  )
}
