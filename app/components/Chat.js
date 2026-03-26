'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useAuth } from '@/lib/AuthContext'

export default function Chat({ goTo, settings, sessionData }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(300)
  const [activeTab, setActiveTab] = useState(settings.chatType === 'voice' ? 'voice' : 'text')
  const [reaction, setReaction] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const chatRef = useRef(null)
  const typingTimeout = useRef(null)
  const timerRef = useRef(null)
  const socket = getSocket()

  const partner = sessionData?.partner || { username: 'Stranger', country: 'Unknown', avatar: '?' }
  const sessionId = sessionData?.sessionId
  const userId = user?.id || sessionData?.userId
  const username = profile?.username || user?.user_metadata?.username || 'You'
  const isInitiator = sessionData?.isInitiator

  const { localVideoRef, remoteVideoRef, isConnected: webrtcConnected, isMuted, isCameraOff, error: webrtcError, toggleMute, toggleCamera, endCall } = useWebRTC({
    sessionId, chatType: settings.chatType, isInitiator
  })

  // Add message to chat
  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }])
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }, [])

  useEffect(() => {
    // Welcome message
    addMessage({ type: 'system', text: `Connected with ${partner.username} from ${partner.country} 🌍` })
    addMessage({ type: 'system', text: `Topic: ${sessionData?.topic || 'Have a great chat!'}` })

    // Socket listeners
    socket.on('chat:message', (msg) => {
      if (msg.senderId !== userId) {
        addMessage({ type: 'theirs', sender: partner.username, text: msg.content, time: new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) })
      }
    })

    socket.on('chat:reaction', ({ emoji, senderId }) => {
      if (senderId !== userId) {
        setReaction(emoji)
        setTimeout(() => setReaction(null), 1500)
      }
    })

    socket.on('chat:typing', ({ isTyping }) => {
      setPartnerTyping(isTyping)
    })

    socket.on('chat:ended', ({ reason, duration }) => {
      clearInterval(timerRef.current)
      setIsEnded(true)
      addMessage({ type: 'system', text: reason === 'disconnected' ? `${partner.username} disconnected` : 'Chat ended' })
      setTimeout(() => goTo('endscreen', { sessionId, partnerId: partner.userId, partnerName: partner.username }), 2000)
    })

    // Timer
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          socket.emit('chat:end', { sessionId, reason: 'timer' })
          goTo('endscreen', { sessionId, partnerId: partner.userId, partnerName: partner.username })
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => {
      clearInterval(timerRef.current)
      socket.off('chat:message')
      socket.off('chat:reaction')
      socket.off('chat:typing')
      socket.off('chat:ended')
    }
  }, [])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || isEnded) return
    const now = new Date()
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    addMessage({ type: 'mine', sender: 'You', text, time })
    socket.emit('chat:message', { sessionId, content: text, messageType: 'text' })
    socket.emit('chat:typing', { sessionId, isTyping: false })
    setInput('')
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    socket.emit('chat:typing', { sessionId, isTyping: true })
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socket.emit('chat:typing', { sessionId, isTyping: false })
    }, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const sendReaction = (emoji) => {
    setReaction(emoji)
    setTimeout(() => setReaction(null), 1500)
    socket.emit('chat:reaction', { sessionId, emoji })
    addMessage({ type: 'mine', sender: 'You', text: emoji, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) })
  }

  const handleSkip = () => {
    socket.emit('chat:end', { sessionId, reason: 'skipped' })
    endCall()
    goTo('endscreen', { sessionId, partnerId: partner.userId, partnerName: partner.username })
  }

  const handleReport = () => {
    const reason = prompt('Reason for report:\n1. Inappropriate content\n2. Harassment\n3. Spam\n4. Underage user\n5. Other')
    if (reason) {
      socket.emit('user:report', { sessionId, reportedUserId: partner.userId, reason })
    }
  }

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timerStr = `${mins}:${String(secs).padStart(2, '0')}`
  const timerDanger = secondsLeft < 60
  const modeName = { debate: 'DEBATE', roast: 'ROAST', opinion: 'OPINION', quiz: 'QUIZ', random: 'RANDOM' }[settings.mode] || 'CHAT'

  const s = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', maxWidth: 520, margin: '0 auto', position: 'relative' },
    topBar: { background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
    avatar: (color) => ({ width: 42, height: 42, borderRadius: '50%', background: color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }),
    timerBox: { background: timerDanger ? 'rgba(239,68,68,0.1)' : 'rgba(255,107,53,0.1)', border: `1px solid ${timerDanger ? 'rgba(239,68,68,0.4)' : 'rgba(255,107,53,0.25)'}`, borderRadius: 12, padding: '6px 12px', textAlign: 'center', flexShrink: 0 },
    modeBanner: { background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
    modePill: { background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.35)', borderRadius: 100, padding: '3px 10px', fontSize: 11, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 },
    tabs: { display: 'flex', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 },
    tab: (active) => ({ flex: 1, padding: 10, textAlign: 'center', fontSize: 13, color: active ? 'var(--accent)' : 'var(--muted)', background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, fontFamily: 'inherit', transition: 'all 0.15s', cursor: 'pointer' }),
    chatArea: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
    msg: (type) => ({ maxWidth: '78%', padding: '10px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.5, alignSelf: type === 'mine' ? 'flex-end' : type === 'system' ? 'center' : 'flex-start', background: type === 'mine' ? 'rgba(255,107,53,0.18)' : type === 'system' ? 'var(--bg3)' : 'var(--bg3)', border: `1px solid ${type === 'mine' ? 'rgba(255,107,53,0.25)' : 'var(--border)'}`, borderBottomRightRadius: type === 'mine' ? 4 : 14, borderBottomLeftRadius: type === 'theirs' ? 4 : 14, color: type === 'system' ? 'var(--muted)' : 'var(--text)', fontSize: type === 'system' ? 12 : 14 }),
    reactionPop: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 80, zIndex: 100, animation: 'popIn 1.5s forwards', pointerEvents: 'none' },
    reactionBar: { display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto', background: 'var(--bg2)', borderTop: '1px solid var(--border)', flexShrink: 0 },
    reactBtn: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 100, padding: '5px 10px', fontSize: 16, flexShrink: 0 },
    inputArea: { display: 'flex', gap: 8, padding: '10px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', alignItems: 'flex-end', flexShrink: 0 },
    input: { flex: 1, resize: 'none', maxHeight: 100, borderRadius: 12, padding: '10px 14px', fontSize: 14, lineHeight: 1.4 },
    sendBtn: { width: 40, height: 40, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'white', fontSize: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    bottomBar: { display: 'flex', gap: 8, padding: '10px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', flexShrink: 0 },
    skipBtn: { flex: 1, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg2)', color: '#ccc', fontSize: 14, fontWeight: 500, fontFamily: 'inherit' },
    nextBtn: { flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' },
    reportBtn: { width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    videoArea: { flex: 1, padding: 16, display: 'flex', gap: 12 },
    videoBox: { flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 200, overflow: 'hidden', position: 'relative' },
    vcBtn: (danger) => ({ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${danger ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`, background: danger ? 'rgba(239,68,68,0.15)' : 'var(--bg2)', color: danger ? 'var(--danger)' : '#ccc', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    voiceArea: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
    voiceCircle: { width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,107,53,0.12)', border: '2px solid rgba(255,107,53,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, animation: 'voicePulse 1.8s ease-in-out infinite' },
  }

  const avatarColors = ['#ff6b35','#8b5cf6','#06b6d4','#ec4899','#f59e0b','#10b981']
  const avatarColor = avatarColors[partner.username?.charCodeAt(0) % avatarColors.length] || '#ff6b35'

  return (
    <div style={s.container}>
      <style>{`
        @keyframes popIn { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)} 20%{opacity:1;transform:translate(-50%,-60%) scale(1.2)} 80%{opacity:1;transform:translate(-50%,-70%) scale(1)} 100%{opacity:0;transform:translate(-50%,-90%) scale(0.8)} }
        @keyframes voicePulse { 0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,107,53,0.2)} 50%{transform:scale(1.06);box-shadow:0 0 0 12px rgba(255,107,53,0)} }
      `}</style>

      {reaction && <div style={s.reactionPop}>{reaction}</div>}

      {/* TOP BAR */}
      <div style={s.topBar}>
        <div style={s.avatar(avatarColor)}>{partner.avatar || partner.username?.[0]?.toUpperCase() || '?'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{partner.username}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{partner.country} · Connected ✓</div>
        </div>
        <div style={s.timerBox}>
          <div style={{ fontSize: 18, fontWeight: 700, color: timerDanger ? 'var(--danger)' : 'var(--accent)' }}>{timerStr}</div>
          <div style={{ fontSize: 10, color: timerDanger ? 'var(--danger)' : 'var(--accent)', opacity: 0.7 }}>left</div>
        </div>
      </div>

      {/* MODE BANNER */}
      <div style={s.modeBanner}>
        <span style={s.modePill}>{modeName}</span>
        <span style={{ fontSize: 13, color: '#ccc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sessionData?.topic}</span>
      </div>

      {/* TABS */}
      <div style={s.tabs}>
        {settings.chatType !== 'voice' && <button style={s.tab(activeTab === 'text')} onClick={() => setActiveTab('text')}>💬 Text</button>}
        {settings.chatType === 'video' && <button style={s.tab(activeTab === 'video')} onClick={() => setActiveTab('video')}>🎥 Video</button>}
        {settings.chatType === 'voice' && <button style={s.tab(activeTab === 'voice')} onClick={() => setActiveTab('voice')}>🎤 Voice</button>}
      </div>

      {/* TEXT CHAT */}
      {activeTab === 'text' && (
        <div style={s.chatArea} ref={chatRef}>
          {messages.map(m => (
            <div key={m.id} style={s.msg(m.type)}>
              {m.type === 'theirs' && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{m.sender}</div>}
              <div>{m.text}</div>
              {m.time && <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4, textAlign: 'right' }}>{m.time}</div>}
            </div>
          ))}
          {partnerTyping && (
            <div style={{ ...s.msg('theirs'), opacity: 0.6, fontSize: 12 }}>
              {partner.username} is typing...
            </div>
          )}
        </div>
      )}

      {/* VIDEO CHAT */}
      {activeTab === 'video' && (
        <div style={s.videoArea}>
          <div style={s.videoBox}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
            {!webrtcConnected && (
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={s.avatar(avatarColor)}>{partner.username?.[0]?.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Connecting...</div>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11, color: 'white', background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '3px 8px' }}>{partner.username}</div>
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
              <button style={s.vcBtn(false)} onClick={toggleMute}>{isMuted ? '🔇' : '🎤'}</button>
            </div>
          </div>
          <div style={{ ...s.videoBox, border: '1px solid rgba(255,107,53,0.3)', maxWidth: 120, maxHeight: 160, alignSelf: 'flex-start' }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
            <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, color: 'white', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 6px' }}>You</div>
          </div>
          {webrtcError && <div style={{ position: 'absolute', top: 120, left: 16, right: 16, background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)', borderRadius: 10, padding: 10, fontSize: 13, color: 'var(--danger)' }}>{webrtcError}</div>}
        </div>
      )}

      {/* VOICE CHAT */}
      {activeTab === 'voice' && (
        <div style={s.voiceArea}>
          <div style={s.voiceCircle}>🎤</div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Talking with {partner.username}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{isMuted ? '🔇 You are muted' : '🎤 Voice active — speak freely!'}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button style={s.vcBtn(isMuted)} onClick={toggleMute}>{isMuted ? '🔇' : '🎤'}</button>
            <button style={{ ...s.vcBtn(true), width: 'auto', padding: '0 16px', borderRadius: 20 }} onClick={handleSkip}>End</button>
          </div>
          {webrtcError && <div style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center', maxWidth: 280 }}>{webrtcError}</div>}
        </div>
      )}

      {/* REACTIONS */}
      <div style={s.reactionBar}>
        {['🔥','😂','👏','🤯','💀','❤️','🎯','👑','😭','🫡'].map(e => (
          <button key={e} style={s.reactBtn} onClick={() => sendReaction(e)}>{e}</button>
        ))}
      </div>

      {/* TEXT INPUT */}
      {activeTab === 'text' && (
        <div style={s.inputArea}>
          <textarea style={s.input} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Type your message..." rows={1} disabled={isEnded} />
          <button style={s.sendBtn} onClick={sendMessage} disabled={isEnded}>➤</button>
        </div>
      )}

      {/* BOTTOM BAR */}
      <div style={s.bottomBar}>
        <button style={s.skipBtn} onClick={handleSkip}>Skip</button>
        <button style={s.nextBtn} onClick={handleSkip}>Next Stranger ⚡</button>
        <button style={s.reportBtn} onClick={handleReport}>🚩</button>
      </div>
    </div>
  )
}
