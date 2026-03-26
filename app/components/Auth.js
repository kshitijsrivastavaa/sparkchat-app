'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const COUNTRIES = ['India','USA','Brazil','UK','Canada','Australia','Japan','Germany','France','Philippines','Nigeria','Indonesia']
const LANGUAGES = ['English','Hindi','Spanish','Portuguese','French','Japanese','German','Tagalog','Yoruba','Bahasa']

export default function Auth({ goTo }) {
  const [mode, setMode] = useState('login') // login | signup
  const [step, setStep] = useState(1) // signup has 2 steps
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', username: '',
    age: '', country: 'India', language: 'English',
    isStudent: false, college: '', agreedToTerms: false
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    goTo('setup')
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    if (!form.agreedToTerms) { setError('Please agree to terms to continue'); return }
    if (parseInt(form.age) < 18) { setError('You must be 18+ to use SparkChat'); return }
    setError(''); setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          age: parseInt(form.age),
          country: form.country,
          language: form.language,
          is_student: form.isStudent,
          college: form.college
        }
      }
    })

    if (error) { setError(error.message); setLoading(false); return }

    // Create profile in users table
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: form.email,
        username: form.username,
        password_hash: 'managed_by_supabase_auth',
        age: parseInt(form.age),
        country: form.country,
        language: form.language,
        is_student: form.isStudent,
        college: form.college || null,
      })
    }
    setLoading(false)
    goTo('setup')
  }

  const s = { // styles
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' },
    card: { width: '100%', maxWidth: 400, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '2rem 1.5rem' },
    logo: { textAlign: 'center', marginBottom: '1.5rem' },
    logoText: { fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #ff6b35, #ffab87)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    tabs: { display: 'flex', marginBottom: '1.5rem', background: 'var(--bg3)', borderRadius: 12, padding: 4 },
    tab: (active) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: active ? 'var(--bg2)' : 'transparent', color: active ? 'var(--text)' : 'var(--muted)', fontWeight: active ? 600 : 400, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s' }),
    field: { marginBottom: '1rem' },
    label: { fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' },
    row: { display: 'flex', gap: 10 },
    checkRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', fontSize: 14, color: 'var(--muted)' },
    btn: { width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #ff6b35, #e84d0e)', color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', marginTop: '0.5rem', boxShadow: '0 6px 24px rgba(255,107,53,0.3)' },
    error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ef4444', marginBottom: '1rem' },
    back: { background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 14, padding: '8px 0', fontFamily: 'inherit', marginBottom: '1rem' },
    guestBtn: { width: '100%', padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--muted)', fontSize: 14, fontFamily: 'inherit', marginTop: 10 },
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={{ fontSize: 32 }}>⚡</div>
          <div style={s.logoText}>SparkChat</div>
        </div>

        <div style={s.tabs}>
          <button style={s.tab(mode==='login')} onClick={() => { setMode('login'); setStep(1) }}>Login</button>
          <button style={s.tab(mode==='signup')} onClick={() => { setMode('signup'); setStep(1) }}>Sign Up</button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login ⚡'}
            </button>
            <button style={s.guestBtn} type="button" onClick={() => goTo('setup')}>
              Continue as Guest (5 chats/day)
            </button>
          </form>
        )}

        {/* SIGNUP STEP 1 */}
        {mode === 'signup' && step === 1 && (
          <form onSubmit={handleSignup}>
            <div style={s.field}>
              <label style={s.label}>Username</label>
              <input type="text" placeholder="cooluser123" value={form.username} onChange={e => set('username', e.target.value)} required minLength={3} maxLength={20} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input type="password" placeholder="minimum 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
            </div>
            <button style={s.btn} type="submit">Next →</button>
          </form>
        )}

        {/* SIGNUP STEP 2 */}
        {mode === 'signup' && step === 2 && (
          <form onSubmit={handleSignup}>
            <button style={s.back} type="button" onClick={() => setStep(1)}>← Back</button>
            <div style={s.row}>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>Age</label>
                <input type="number" placeholder="18+" value={form.age} onChange={e => set('age', e.target.value)} required min={18} max={100} />
              </div>
              <div style={{ ...s.field, flex: 2 }}>
                <label style={s.label}>Country</label>
                <select value={form.country} onChange={e => set('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Language</label>
              <select value={form.language} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div style={s.checkRow}>
              <input type="checkbox" id="student" checked={form.isStudent} onChange={e => set('isStudent', e.target.checked)} style={{ width: 18, height: 18, padding: 0, accentColor: 'var(--accent)' }} />
              <label htmlFor="student">I am a student</label>
            </div>
            {form.isStudent && (
              <div style={s.field}>
                <label style={s.label}>College Name</label>
                <input type="text" placeholder="IIT Delhi, VIT, etc." value={form.college} onChange={e => set('college', e.target.value)} />
              </div>
            )}
            <div style={s.checkRow}>
              <input type="checkbox" id="terms" checked={form.agreedToTerms} onChange={e => set('agreedToTerms', e.target.checked)} style={{ width: 18, height: 18, padding: 0, accentColor: 'var(--accent)' }} />
              <label htmlFor="terms">I am 18+ and agree to <span style={{ color: 'var(--accent)' }}>Terms & Community Guidelines</span></label>
            </div>
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account 🚀'}
            </button>
          </form>
        )}
      </div>

      <button style={{ ...s.guestBtn, maxWidth: 400, marginTop: 12, background: 'transparent', border: 'none' }} onClick={() => goTo('landing')}>
        ← Back to Home
      </button>
    </div>
  )
}
