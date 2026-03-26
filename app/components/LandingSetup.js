'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'

// ==================== LANDING ====================
export function Landing({ goTo }) {
  const { user } = useAuth()
  const [online, setOnline] = useState(2847)

  useEffect(() => {
    fetch('/api/online-count').then(r => r.json()).then(d => setOnline(d.count)).catch(() => {})
    const i = setInterval(() => setOnline(p => p + Math.floor(Math.random() * 20) - 10), 3000)
    return () => clearInterval(i)
  }, [])

  const s = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '3rem 1.5rem 2rem', position: 'relative', overflow: 'hidden' },
    bg: { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,107,53,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
    logoText: { fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg, #ff6b35, #ffab87)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -1 },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 100, padding: '8px 16px', fontSize: 13, color: '#aaa' },
    dot: { width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', animation: 'pulse 2s infinite' },
    statNum: { fontSize: 22, fontWeight: 700, color: 'var(--accent)' },
    modeCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, cursor: 'pointer', transition: 'all 0.2s' },
    primaryBtn: { width: '100%', maxWidth: 360, padding: 18, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #ff6b35, #e84d0e)', color: 'white', fontSize: 18, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(255,107,53,0.3)' },
  }

  return (
    <div style={s.container}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={s.bg} />

      <div style={{ textAlign: 'center', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 40, filter: 'drop-shadow(0 0 12px rgba(255,107,53,0.6))' }}>⚡</span>
          <div style={s.logoText}>SparkChat</div>
        </div>
        <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 260, lineHeight: 1.5 }}>Random 5-min chats with strangers worldwide — with fun game modes.</p>
        <div style={s.badge}><div style={s.dot} /><span>{online.toLocaleString()} people online now</span></div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[['1.2M+','chats today'],['180+','countries'],['4.8★','rating']].map(([n,l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={s.statNum}>{n}</div>
              <div style={{ fontSize: 11, color: 'var(--dim)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 400, zIndex: 1 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>Choose your vibe</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['🔥','Debate','Argue opposite sides'],['🤣','Roast','Friendly roast battle'],['🧠','Quiz','Compete live'],['💭','Opinion','Hottest takes']].map(([icon,name,desc]) => (
            <div key={name} style={s.modeCard} onClick={() => goTo('setup')}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', zIndex: 1 }}>
        <button style={s.primaryBtn} onClick={() => goTo(user ? 'setup' : 'auth')}>
          {user ? 'Start Chatting ⚡' : 'Get Started ⚡'}
        </button>
        {user && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Welcome back! 👋</p>}
        {!user && <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }} onClick={() => goTo('setup')}>Continue as Guest (5 chats/day)</button>}
        <p style={{ fontSize: 12, color: 'var(--dim)' }}>18+ only · No recording · Privacy protected</p>
      </div>
    </div>
  )
}

// ==================== SETUP ====================
const CHAT_TYPES = [
  { id: 'text', icon: '💬', name: 'Text Chat', desc: 'Type and chat anonymously' },
  { id: 'video', icon: '🎥', name: 'Video Chat', desc: 'Face to face with strangers' },
  { id: 'voice', icon: '🎤', name: 'Voice Only', desc: 'Talk without showing face' },
]
const MODES = [
  { id: 'debate', icon: '🔥', name: 'Debate Mode', desc: 'Get opposite sides, argue it out!' },
  { id: 'roast', icon: '🤣', name: 'Roast Mode', desc: 'Friendly roasting battle' },
  { id: 'opinion', icon: '💭', name: 'Unpopular Opinion', desc: 'Share your hottest take' },
  { id: 'quiz', icon: '🧠', name: 'Quiz Mode', desc: 'Compete on random questions live' },
  { id: 'random', icon: '🎲', name: 'Random Mode', desc: 'Surprise me every time!' },
]
const COUNTRIES = ['Any','India','USA','Brazil','UK','Philippines','Japan','Nigeria','Indonesia','Germany']
const LANGUAGES = ['Any','English','Hindi','Spanish','Portuguese','French','Japanese','Tagalog']
const PREFS = ['Anyone','Students only','Same country','Different country','English speakers','Hindi speakers']

export function Setup({ goTo, settings, setSettings }) {
  const [chatType, setChatType] = useState(settings.chatType)
  const [mode, setMode] = useState(settings.mode)
  const [prefs, setPrefs] = useState(settings.preferences)
  const [country, setCountry] = useState(settings.country || 'Any')
  const [language, setLanguage] = useState(settings.language || 'Any')
  const [agreed, setAgreed] = useState(false)

  const togglePref = (p) => setPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const handleStart = () => {
    if (!agreed) { alert('Please confirm you are 18+ to continue'); return }
    setSettings({ chatType, mode, preferences: prefs, country, language })
    goTo('waiting')
  }

  const s = {
    container: { minHeight: '100vh', padding: '1.5rem', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', overflowY: 'auto' },
    label: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'block' },
    card: (sel) => ({ background: sel ? 'rgba(255,107,53,0.08)' : 'var(--bg2)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }),
    check: (sel) => ({ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, background: sel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', flexShrink: 0 }),
    chip: (sel) => ({ padding: '8px 14px', borderRadius: 100, border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, background: sel ? 'rgba(255,107,53,0.12)' : 'var(--bg2)', color: sel ? 'var(--accent)' : '#ccc', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s' }),
    startBtn: { width: '100%', padding: 16, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'white', fontSize: 17, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(255,107,53,0.3)', marginTop: '0.5rem' },
    row: { display: 'flex', gap: 10 },
  }

  return (
    <div style={s.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => goTo('landing')}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Set up your chat</h2>
      </div>

      {/* Chat Type */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={s.label}>Chat Type</span>
        {CHAT_TYPES.map(t => (
          <div key={t.id} style={s.card(chatType === t.id)} onClick={() => setChatType(t.id)}>
            <span style={{ fontSize: 22, width: 36, textAlign: 'center' }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.desc}</div>
            </div>
            <div style={s.check(chatType === t.id)}>{chatType === t.id && '✓'}</div>
          </div>
        ))}
      </div>

      {/* Fun Mode */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={s.label}>Fun Mode</span>
        {MODES.map(m => (
          <div key={m.id} style={s.card(mode === m.id)} onClick={() => setMode(m.id)}>
            <span style={{ fontSize: 22, width: 36, textAlign: 'center' }}>{m.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.desc}</div>
            </div>
            <div style={s.check(mode === m.id)}>{mode === m.id && '✓'}</div>
          </div>
        ))}
      </div>

      {/* Preferences */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={s.label}>Match Preference</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PREFS.map(p => <button key={p} style={s.chip(prefs.includes(p))} onClick={() => togglePref(p)}>{p}</button>)}
        </div>
      </div>

      {/* Country + Language */}
      <div style={{ ...s.row, marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <span style={s.label}>Country</span>
          <select value={country} onChange={e => setCountry(e.target.value)}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <span style={s.label}>Language</span>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Age Agreement */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1.5 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', padding: 0, background: 'transparent', border: '1px solid var(--border)', borderRadius: 4 }} />
          <span>I confirm I am <strong style={{ color: 'var(--text)' }}>18 years or older</strong> and agree to the Community Guidelines. I will not share inappropriate content.</span>
        </label>
      </div>

      <button style={s.startBtn} onClick={handleStart}>Find My Match ⚡</button>
      <div style={{ height: '1rem' }} />
    </div>
  )
}

export default Landing
