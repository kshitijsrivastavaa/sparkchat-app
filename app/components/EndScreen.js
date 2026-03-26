'use client'
import { useState } from 'react'
import { getSocket } from '@/hooks/useSocket'
import { useAuth } from '@/lib/AuthContext'

export default function EndScreen({ goTo, sessionData }) {
  const { user, profile } = useAuth()
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const socket = getSocket()

  const handleRate = async (stars) => {
    setRating(stars)
    setRated(true)
    socket.emit('chat:rate', {
      sessionId: sessionData?.sessionId,
      stars,
      ratedUserId: sessionData?.partnerId
    })
  }

  const handleUpgrade = async (plan) => {
    setPayLoading(true)
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user?.id })
      })
      const { orderId, amount, currency } = await res.json()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'SparkChat',
        description: plan === 'spark_pro' ? 'Spark Pro — ₹10/week' : 'Pro Plus — ₹25/week',
        order_id: orderId,
        handler: async (response) => {
          await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, plan, userId: user?.id })
          })
          alert('🎉 Payment successful! You are now on ' + plan)
          setPayLoading(false)
        },
        prefill: { email: user?.email },
        theme: { color: '#ff6b35' },
        modal: { ondismiss: () => setPayLoading(false) }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      alert('Payment failed. Try again.')
      setPayLoading(false)
    }
  }

  const s = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', gap: '1rem', maxWidth: 420, margin: '0 auto' },
    card: { width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', textAlign: 'center' },
    stars: { display: 'flex', gap: 8, margin: '0.2rem 0' },
    star: (lit) => ({ fontSize: 36, opacity: lit ? 1 : 0.3, background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', transition: 'opacity 0.15s, transform 0.15s' }),
    flagChip: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 100, padding: '4px 12px', fontSize: 13 },
    primaryBtn: { width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(255,107,53,0.3)' },
    secondaryBtn: { width: '100%', padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg3)', color: '#ccc', fontSize: 14, fontFamily: 'inherit' },
    proBox: (highlight) => ({ width: '100%', background: highlight ? 'rgba(255,107,53,0.08)' : 'var(--bg2)', border: `1px solid ${highlight ? 'rgba(255,107,53,0.4)' : 'var(--border)'}`, borderRadius: 16, padding: 16, position: 'relative' }),
    proBadge: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', borderRadius: 100, padding: '2px 12px', fontSize: 11, fontWeight: 700, color: 'white', whiteSpace: 'nowrap' },
  }

  return (
    <div style={s.container}>
      {/* MAIN CARD */}
      <div style={s.card}>
        <div style={{ fontSize: 56 }}>✨</div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Chat Ended!</h2>
        {sessionData?.partnerName && (
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>You chatted with <strong style={{ color: 'var(--text)' }}>{sessionData.partnerName}</strong></p>
        )}

        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>How was your experience?</p>
        <div style={s.stars}>
          {[1,2,3,4,5].map(n => (
            <button key={n} style={s.star(rating >= n)} onClick={() => handleRate(n)}>★</button>
          ))}
        </div>
        {rated && (
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: 'var(--muted)' }}>
            {rating >= 4 ? '🎉 Thanks! Glad you enjoyed it!' : '😔 Sorry — we are always improving!'}
          </div>
        )}

        <div style={{ width: '100%', marginTop: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Countries you talked to today</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={s.flagChip}>🇮🇳 India</span>
            <span style={s.flagChip}>🇧🇷 Brazil</span>
            <span style={s.flagChip}>🇵🇭 Philippines</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 8 }}>
          <button style={s.primaryBtn} onClick={() => goTo('waiting')}>Find Next Match ⚡</button>
          <button style={s.secondaryBtn} onClick={() => goTo('setup')}>Change Settings</button>
          <button style={s.secondaryBtn} onClick={() => goTo('landing')}>Go Home</button>
        </div>
      </div>

      {/* UPGRADE — SPARK PRO */}
      {!profile?.is_premium && (
        <>
          <div style={s.proBox(true)}>
            <div style={s.proBadge}>⭐ MOST POPULAR</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>⚡ Spark Pro</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>₹10/week</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Unlimited chats · All modes · No ads · Priority matching</p>
            <button
              style={{ ...s.primaryBtn, opacity: payLoading ? 0.7 : 1 }}
              onClick={() => handleUpgrade('spark_pro')}
              disabled={payLoading}
            >
              {payLoading ? 'Processing...' : 'Upgrade to Pro ⚡'}
            </button>
          </div>

          <div style={s.proBox(false)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>👑 Pro Plus</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>₹25/week</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Everything in Pro · Group rooms · Virtual gifts · Country picker</p>
            <button
              style={{ ...s.secondaryBtn, padding: 12 }}
              onClick={() => handleUpgrade('pro_plus')}
              disabled={payLoading}
            >
              Upgrade to Pro Plus 👑
            </button>
          </div>
        </>
      )}

      {profile?.is_premium && (
        <div style={{ fontSize: 14, color: 'var(--success)', textAlign: 'center' }}>
          ✅ You are on Spark Pro — enjoy unlimited chats!
        </div>
      )}
    </div>
  )
}
