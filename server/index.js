require('dotenv').config({ path: '.env.local' })
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

app.use(cors())
app.use(express.json())

const waitingQueues = {}
const activeSessions = {}
const socketToUser = {}
const userToSocket = {}
const PORT = process.env.SOCKET_PORT || 3001

app.get('/health', (req, res) => {
  res.json({ status: 'ok', onlineUsers: Object.keys(socketToUser).length })
})

app.get('/online-count', (req, res) => {
  res.json({ count: Object.keys(socketToUser).length || 2847 })
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('user:join', (userData) => {
    const { userId, username, country, language } = userData
    socketToUser[socket.id] = { userId, username, country, language, socketId: socket.id }
    userToSocket[userId] = socket.id
    io.emit('online:count', Object.keys(socketToUser).length)
  })

  socket.on('match:find', (preferences) => {
    const { userId, chatType, mode } = preferences
    const user = socketToUser[socket.id]
    if (!user) return

    const queueKey = `${chatType}:${mode}`
    if (!waitingQueues[queueKey]) waitingQueues[queueKey] = []

    const waitingUser = waitingQueues[queueKey].find(w =>
      w.socketId !== socket.id && w.userId !== userId
    )

    if (waitingUser) {
      waitingQueues[queueKey] = waitingQueues[queueKey].filter(w => w.socketId !== waitingUser.socketId)

      const sessionId = uuidv4()
      const topic = getRandomTopic(mode)
      const roomId = `room:${sessionId}`

      socket.join(roomId)
      const partnerSocket = io.sockets.sockets.get(waitingUser.socketId)
      if (partnerSocket) partnerSocket.join(roomId)

      activeSessions[sessionId] = {
        id: sessionId, roomId,
        user1: { ...waitingUser },
        user2: { userId, socketId: socket.id, username: user.username, country: user.country },
        chatType, mode, topic, startedAt: Date.now()
      }

      const matchData = { sessionId, roomId, topic, mode, chatType }

      socket.emit('match:found', {
        ...matchData,
        partner: { username: waitingUser.username, country: waitingUser.country, avatar: waitingUser.username?.[0]?.toUpperCase() || '?' }
      })

      if (partnerSocket) {
        partnerSocket.emit('match:found', {
          ...matchData,
          partner: { username: user.username, country: user.country, avatar: user.username?.[0]?.toUpperCase() || '?' }
        })
      }
      console.log(`Match: ${user.username} <-> ${waitingUser.username}`)
    } else {
      waitingQueues[queueKey].push({
        userId, socketId: socket.id,
        username: user.username, country: user.country,
        language: user.language, joinedAt: Date.now()
      })
      socket.emit('match:waiting', { position: waitingQueues[queueKey].length })
    }
  })

  socket.on('match:cancel', () => {
    removeFromAllQueues(socket.id)
    socket.emit('match:cancelled')
  })

  socket.on('chat:message', (data) => {
    const { sessionId, content, messageType = 'text' } = data
    const session = activeSessions[sessionId]
    if (!session) return
    const user = socketToUser[socket.id]
    io.to(session.roomId).emit('chat:message', {
      id: uuidv4(), sessionId,
      senderId: user?.userId, senderName: user?.username,
      content, messageType, timestamp: new Date().toISOString()
    })
  })

  socket.on('chat:reaction', (data) => {
    const { sessionId, emoji } = data
    const session = activeSessions[sessionId]
    if (!session) return
    const user = socketToUser[socket.id]
    io.to(session.roomId).emit('chat:reaction', { emoji, senderName: user?.username, senderId: user?.userId })
  })

  socket.on('webrtc:offer', (data) => {
    const session = activeSessions[data.sessionId]
    if (session) socket.to(session.roomId).emit('webrtc:offer', { offer: data.offer, from: socket.id })
  })

  socket.on('webrtc:answer', (data) => {
    const session = activeSessions[data.sessionId]
    if (session) socket.to(session.roomId).emit('webrtc:answer', { answer: data.answer, from: socket.id })
  })

  socket.on('webrtc:ice-candidate', (data) => {
    const session = activeSessions[data.sessionId]
    if (session) socket.to(session.roomId).emit('webrtc:ice-candidate', { candidate: data.candidate, from: socket.id })
  })

  socket.on('chat:typing', (data) => {
    const session = activeSessions[data.sessionId]
    if (session) socket.to(session.roomId).emit('chat:typing', { isTyping: data.isTyping })
  })

  socket.on('chat:end', (data) => endSession(data.sessionId, data.reason || 'ended'))

  socket.on('chat:rate', (data) => {
    console.log('Rating received:', data.stars, 'stars for session', data.sessionId)
  })

  socket.on('user:report', (data) => {
    console.log('Report received for session:', data.sessionId, 'reason:', data.reason)
    socket.emit('report:success', { message: 'Report submitted. We will review within 24 hours.' })
  })

  socket.on('disconnect', () => {
    const user = socketToUser[socket.id]
    if (user) {
      const session = findSessionBySocket(socket.id)
      if (session) endSession(session.id, 'disconnected')
      removeFromAllQueues(socket.id)
      delete userToSocket[user.userId]
      delete socketToUser[socket.id]
      io.emit('online:count', Object.keys(socketToUser).length)
      console.log('Disconnected:', user.username)
    }
  })
})

function endSession(sessionId, reason) {
  const session = activeSessions[sessionId]
  if (!session) return
  const duration = Math.floor((Date.now() - session.startedAt) / 1000)
  io.to(session.roomId).emit('chat:ended', { reason, duration })
  delete activeSessions[sessionId]
}

function removeFromAllQueues(socketId) {
  Object.keys(waitingQueues).forEach(key => {
    waitingQueues[key] = waitingQueues[key].filter(u => u.socketId !== socketId)
  })
}

function findSessionBySocket(socketId) {
  return Object.values(activeSessions).find(s =>
    s.user1.socketId === socketId || s.user2.socketId === socketId
  )
}

function getRandomTopic(mode) {
  const topics = {
    debate: ['Maggi vs Pasta — defend your side!','Cricket vs Football — which rules?','iOS vs Android — pick your side!','WFH vs Office — what is better?','Bollywood vs Hollywood!'],
    roast: ['Roast each other in 2 minutes!','Roast the other person city!','Friendly roast battle — go!'],
    opinion: ['Most unpopular food opinion?','Most overrated thing in life?','Hot take on social media?','Pineapple on pizza — yes or no?'],
    quiz: ['What is the capital of Australia?','How many planets in solar system?','Who invented the telephone?','What is 17 x 13?'],
    random: ['Would you rather fly or be invisible?','Describe life in 3 emojis!','What would you do with 1 crore?','Best superpower and why?']
  }
  const list = topics[mode] || topics.random
  return list[Math.floor(Math.random() * list.length)]
}

server.listen(PORT, () => {
  console.log(`SparkChat server running on port ${PORT}`)
  console.log(`Health: http://localhost:${PORT}/health`)
})
