'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Landing from './components/Landing'
import Auth from './components/Auth'
import Setup from './components/Setup'
import Waiting from './components/Waiting'
import Chat from './components/Chat'
import EndScreen from './components/EndScreen'
import Profile from './components/Profile'

export default function Home() {
  const { user, loading } = useAuth()
  const [screen, setScreen] = useState('landing')
  const [settings, setSettings] = useState({
    chatType: 'text', mode: 'debate',
    preferences: ['Anyone'], country: 'Any', language: 'Any'
  })
  const [sessionData, setSessionData] = useState(null)

  useEffect(() => {
    if (!loading && user && screen === 'landing') setScreen('landing')
  }, [user, loading])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontSize: 32 }}>⚡</div>
    </div>
  )

  const goTo = (s, data = null) => {
    if (data) setSessionData(data)
    setScreen(s)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {screen === 'landing'    && <Landing goTo={goTo} />}
      {screen === 'auth'       && <Auth goTo={goTo} />}
      {screen === 'setup'      && <Setup goTo={goTo} settings={settings} setSettings={setSettings} />}
      {screen === 'waiting'    && <Waiting goTo={goTo} settings={settings} setSessionData={setSessionData} />}
      {screen === 'chat'       && <Chat goTo={goTo} settings={settings} sessionData={sessionData} />}
      {screen === 'endscreen'  && <EndScreen goTo={goTo} sessionData={sessionData} />}
      {screen === 'profile'    && <Profile goTo={goTo} />}
    </main>
  )
}
