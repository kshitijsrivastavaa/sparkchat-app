import { useEffect, useRef, useCallback, useState } from 'react'
import { getSocket } from './useSocket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}

export function useWebRTC({ sessionId, chatType, isInitiator }) {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [error, setError] = useState(null)

  const socket = getSocket()

  const getMediaStream = useCallback(async () => {
    try {
      const constraints = {
        audio: true,
        video: chatType === 'video' ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } : false
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream

      if (localVideoRef.current && chatType === 'video') {
        localVideoRef.current.srcObject = stream
      }
      return stream
    } catch (err) {
      setError('Camera/microphone access denied. Please allow permissions.')
      console.error('Media error:', err)
      return null
    }
  }, [chatType])

  const createPeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    // Add local tracks
    const stream = localStreamRef.current || await getMediaStream()
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
      setIsConnected(true)
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', {
          sessionId,
          candidate: event.candidate
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('WebRTC state:', pc.connectionState)
      if (pc.connectionState === 'connected') setIsConnected(true)
      if (pc.connectionState === 'disconnected') setIsConnected(false)
    }

    return pc
  }, [sessionId, getMediaStream])

  // Start call as initiator
  const startCall = useCallback(async () => {
    const pc = await createPeerConnection()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('webrtc:offer', { sessionId, offer })
  }, [sessionId, createPeerConnection])

  // Handle incoming offer
  useEffect(() => {
    const handleOffer = async ({ offer }) => {
      const pc = await createPeerConnection()
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc:answer', { sessionId, answer })
    }

    const handleAnswer = async ({ answer }) => {
      const pc = peerConnectionRef.current
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const handleIceCandidate = async ({ candidate }) => {
      const pc = peerConnectionRef.current
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch (e) {}
      }
    }

    socket.on('webrtc:offer', handleOffer)
    socket.on('webrtc:answer', handleAnswer)
    socket.on('webrtc:ice-candidate', handleIceCandidate)

    return () => {
      socket.off('webrtc:offer', handleOffer)
      socket.off('webrtc:answer', handleAnswer)
      socket.off('webrtc:ice-candidate', handleIceCandidate)
    }
  }, [sessionId, createPeerConnection])

  // Auto-start based on who is initiator
  useEffect(() => {
    if (chatType === 'text') return
    getMediaStream().then(() => {
      if (isInitiator) startCall()
    })
  }, [chatType, isInitiator])

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(prev => !prev)
    }
  }, [])

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsCameraOff(prev => !prev)
    }
  }, [])

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    setIsConnected(false)
  }, [])

  return {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isMuted,
    isCameraOff,
    error,
    toggleMute,
    toggleCamera,
    endCall
  }
}
