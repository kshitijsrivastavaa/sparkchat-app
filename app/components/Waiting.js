'use client'
import { useState, useEffect, useRef } from 'react'
import { getSocket } from '@/hooks/useSocket'
import { useAuth } from '@/lib/AuthContext'

const MESSAGES = [
  'Scanning people online worldwide...',
  'Applying your preferences...',
  'Found potential matches...',
  'Verifying compatibility...',
  'Almost there...',
]

export default function Waiting({ goTo, settings, setSessionData }) {
  const { user, profile } = useAuth()
  const [waitSecs, setWaitSecs] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)
  const [queueCount, setQueueCount] = useState(0)
  const [onlineCount, setOnlineCount] = useState(2847)
  const timerRef = useRef(null)
  const socket = getSocket()

  useEffect(() => {
    // Join socket and start searching
    const userId = user?.id || `guest_${Date.now()}`
    const username = profile?.username || user?.user_metadata?.username || 'Anonymous'
    const country = profile?.country || settings.country || 'India'
    const language = profile?.language || settings.language || 'English'

    socket.emit('user:join', { userId, username, country, language, chatType: settings.chatType, mode: settings.mode })

    socket.emit('match:find', {
      userId,
      chatType: settings.chatType,
      mode: settings.mode,
      country: settings.country,
      language: settings.language,
      matchPref: settings.preferences
    })

    // Listen for match
    socket.on('match:found', (data) => {
      clearInterval(timerRef.current)
      setSessionData({
        ...data,
        userId,
        username,
        isInitiator: true
      })
      goTo('chat', data)
    })

    socket.on('match:waiting', ({ position }) => {
      setQueueCount(position)
    })

    socket.on('online:count', (count) => {
      setOnlineCount(count)
    })

    // Timer
    timerRef.current = setInterval(() => {
      setWaitSecs(s => s + 1)
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1))
    }, 1000)

    return () => {
      clearInterval(timerRef.current)
      socket.off('match:found')
      socket.off('match:waiting')
      socket.off('online:count')
    }
  }, [])

  const handleCancel = () => {
    socket.emit('match:cancel')
    goTo('setup')
  }

  const s = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem', textAlign: 'center', background: 'var(--bg)' },
    spinnerWrap: { position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' },
    innerRing: { position: 'absolute', inset: 14, borderRadius: '50%', border: '1.5px solid var(--border)', borderBottomColor: 'rgba(255,107,53,0.4)', animation: 'spinReverse 1.5s linear infinite' },
    statsRow: { display: 'flex', alignItems: 'center', gap: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 24px' },
    stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
    statNum: { fontSize: 22, fontWeight: 700, color: 'var(--accent)' },
    statLabel: { fontSize: 11, color: 'var(--dim)' },
    divider: { width: 1, height: 32, background: 'var(--border)' },
    cancelBtn: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '10px 28px', borderRadius: 12, fontSize: 14, fontFamily: 'inherit' },
    modeBadge: { background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: 'var(--accent)' }
  }

  return (
    <div style={s.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spinReverse { to { transform: rotate(-360deg); } }
      `}</style>

      <div style={s.spinnerWrap}>
        <div style={s.ring} />
        <div style={s.innerRing} />
        <span style={{ fontSize: 36 }}>⚡</span>
      </div>

      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Finding your match...</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', minHeight: 20 }}>{MESSAGES[msgIndex]}</p>
      </div>

      <div style={s.modeBadge}>
        {settings.chatType.toUpperCase()} · {settings.mode.toUpperCase()} MODE
      </div>

      <div style={s.statsRow}>
        <div style={s.stat}>
          <span style={s.statNum}>{onlineCount.toLocaleString()}</span>
          <span style={s.statLabel}>online now</span>
        </div>
        <div style={s.divider} />
        <div style={s.stat}>
          <span style={s.statNum}>{waitSecs}s</span>
          <span style={s.statLabel}>your wait</span>
        </div>
        <div style={s.divider} />
        <div style={s.stat}>
          <span style={s.statNum}>180+</span>
          <span style={s.statLabel}>countries</span>
        </div>
      </div>

      <button style={s.cancelBtn} onClick={handleCancel}>Cancel</button>
    </div>
  )
}
