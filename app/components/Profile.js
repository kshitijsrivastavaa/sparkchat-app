'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase, updateProfile } from '@/lib/supabase'

const COUNTRIES = ['India','USA','Brazil','UK','Canada','Australia','Japan','Germany','France','Philippines','Nigeria','Indonesia']
const LANGUAGES = ['English','Hindi','Spanish','Portuguese','French','Japanese','German','Tagalog']

export default function Profile({ goTo }) {
  const { user, profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    username: profile?.username || '',
    country: profile?.country || 'India',
    language: profile?.language || 'English',
    college: profile?.college || '',
    is_student: profile?.is_student || false,
  })
  const [msg, setMsg] = useState('')
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateProfile(user.id, form)
    if (error) setMsg('Error saving. Try again.')
    else { setMsg('Profile updated!'); await refreshProfile(); setEditing(false) }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    goTo('landing')
  }

  const s = {
    container: { minHeight: '100vh', padding: '1.5rem', maxWidth: 480, margin: '0 auto' },
    avatarBig: { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b35, #ffab87)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'white', margin: '0 auto 1rem' },
    card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.2rem', marginBottom: '1rem' },
    label: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' },
    statBox: { flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, textAlign: 'center' },
    primaryBtn: { width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit' },
    secondaryBtn: { width: '100%', padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' },
    dangerBtn: { width: '100%', padding: 12, borderRadius: 14, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontSize: 14, fontFamily: 'inherit', marginTop: 8 },
  }

  return (
    <div style={s.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <button style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => goTo('landing')}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Profile</h2>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={s.avatarBig}>{profile?.username?.[0]?.toUpperCase() || '?'}</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{profile?.username || 'Anonymous'}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{user?.email}</div>
        {profile?.is_premium && <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.35)', borderRadius: 100, padding: '4px 12px', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>⚡ Spark Pro</div>}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
        {[['total chats', profile?.total_chats || 0],['reputation', profile?.reputation_score || 100],['today', profile?.chats_today || 0]].map(([l, n]) => (
          <div key={l} style={s.statBox}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Profile Info</span>
          {!editing && <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }} onClick={() => setEditing(true)}>Edit</button>}
        </div>
        {msg && <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--success)', marginBottom: '1rem' }}>{msg}</div>}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div><label style={s.label}>Username</label><input value={form.username} onChange={e => set('username', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><label style={s.label}>Country</label><select value={form.country} onChange={e => set('country', e.target.value)}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div style={{ flex: 1 }}><label style={s.label}>Language</label><select value={form.language} onChange={e => set('language', e.target.value)}>{LANGUAGES.map(l => <option key={l}>{l}</option>)}</select></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_student} onChange={e => set('is_student', e.target.checked)} style={{ width: 16, height: 16, padding: 0, accentColor: 'var(--accent)' }} />
              I am a student
            </label>
            {form.is_student && <div><label style={s.label}>College</label><input placeholder="Your college name" value={form.college} onChange={e => set('college', e.target.value)} /></div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...s.secondaryBtn, flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
              <button style={{ ...s.primaryBtn, flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        ) : (
          <div>
            {[['Country', profile?.country],['Language', profile?.language],['Age', profile?.age],['Student', profile?.is_student ? `Yes${profile?.college ? ` — ${profile.college}` : ''}` : 'No']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span><span>{v || 'Not set'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button style={s.primaryBtn} onClick={() => goTo('setup')}>Start Chatting ⚡</button>
      <button style={{ ...s.secondaryBtn, marginTop: 8 }} onClick={() => goTo('landing')}>Home</button>
      <button style={s.dangerBtn} onClick={handleSignOut}>Sign Out</button>
      <div style={{ height: '2rem' }} />
    </div>
  )
}
