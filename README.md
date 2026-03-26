# ⚡ SparkChat — Complete Full Stack App

Random 5-minute chats with strangers worldwide. Text + Video + Voice + Fun Modes.

---

## 📁 Project Structure

```
sparkchat/
├── server/
│   └── index.js          ← Socket.io + Express backend
├── app/
│   ├── page.js            ← Main app router
│   ├── layout.js          ← Root layout
│   ├── globals.css        ← Dark theme
│   ├── api/
│   │   ├── payment/
│   │   │   ├── create-order/route.js
│   │   │   └── verify/route.js
│   │   └── online-count/route.js
│   └── components/
│       ├── Landing.js     ← Home screen
│       ├── Auth.js        ← Login + Signup (2 steps)
│       ├── Setup.js       ← Chat preferences
│       ├── Waiting.js     ← Real socket matching
│       ├── Chat.js        ← Text + Video + Voice
│       ├── EndScreen.js   ← Rating + Razorpay payment
│       └── Profile.js     ← User profile + stats
├── hooks/
│   ├── useSocket.js       ← Socket.io client hook
│   └── useWebRTC.js       ← WebRTC video/voice hook
├── lib/
│   ├── supabase.js        ← Supabase client + auth helpers
│   └── AuthContext.js     ← React auth provider
├── database.sql           ← Run this in Supabase SQL Editor
├── .env.example           ← Copy to .env.local and fill
├── jsconfig.json          ← Path aliases (@/...)
└── package.json
```

---

## 🚀 HOW TO RUN — Step by Step

### STEP 1 — Install Node.js (if not installed)
```bash
# Check if installed
node -v

# If not installed, run:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

### STEP 2 — Unzip and Open
```bash
cd ~/Desktop
unzip sparkchat-complete.zip
cd sparkchat-complete
```

### STEP 3 — Install dependencies
```bash
npm install
```

### STEP 4 — Set up Supabase (FREE)
1. Go to https://supabase.com → Create free account
2. Click "New Project" → Give it a name
3. Go to SQL Editor → Paste contents of `database.sql` → Run
4. Go to Project Settings → API → Copy:
   - Project URL
   - anon/public key
   - service_role key

### STEP 5 — Create .env.local file
```bash
cp .env.example .env.local
```
Then open .env.local and fill in your Supabase values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
JWT_SECRET=any_long_random_string_here_32chars
RAZORPAY_KEY_ID=rzp_test_xxx (optional for now)
RAZORPAY_KEY_SECRET=xxx (optional for now)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx (optional)
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### STEP 6 — Run the app

Open TWO terminal windows:

**Terminal 1 — Backend server:**
```bash
cd ~/Desktop/sparkchat-complete
node server/index.js
```
You should see:
```
🚀 SparkChat server running on port 3001
📡 Socket.io ready for connections
```

**Terminal 2 — Frontend:**
```bash
cd ~/Desktop/sparkchat-complete
npm run dev
```
You should see:
```
▲ Next.js 14.2.3
- Local: http://localhost:3000
```

### STEP 7 — Open in browser
```
http://localhost:3000
```

**Your app is fully running! 🎉**

---

## ✅ Features Working

| Feature | Status |
|---------|--------|
| Landing page with live counter | ✅ |
| User signup (2-step form) | ✅ |
| User login | ✅ |
| Guest mode (no login) | ✅ |
| Chat type selection (text/video/voice) | ✅ |
| Fun mode selection (5 modes) | ✅ |
| Match preferences + country + language | ✅ |
| Real-time socket matching | ✅ |
| Text chat (real WebSocket) | ✅ |
| Video chat (real WebRTC) | ✅ |
| Voice chat (real WebRTC audio) | ✅ |
| Typing indicator | ✅ |
| Emoji reactions | ✅ |
| 5-minute countdown timer | ✅ |
| Report user system | ✅ |
| Star rating after chat | ✅ |
| User profile + stats | ✅ |
| Razorpay payment integration | ✅ |
| Premium user detection | ✅ |
| Dark theme throughout | ✅ |

---

## 🌐 Deploy to Vercel (Frontend)

```bash
npm install -g vercel
vercel
```
Add all .env.local variables in Vercel dashboard → Settings → Environment Variables.

## 🖥️ Deploy Backend (Socket server)

Options:
- **Railway.app** (easiest, free tier): Connect GitHub, deploy server/index.js
- **Render.com** (free tier): Create web service pointing to server/index.js
- **DigitalOcean** (₹500/month): Full control

After deploying backend, update:
```
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.railway.app
```

---

## 💰 Razorpay Setup (When Ready)

1. Go to razorpay.com → Create account
2. Complete KYC (PAN + bank account)
3. Go to Settings → API Keys
4. Copy Key ID and Key Secret to .env.local
5. Payments will work automatically

---

## 🛑 To Stop the App
Press `Ctrl + C` in both terminals.

## 🔁 To Run Again Next Time
```bash
# Terminal 1
cd ~/Desktop/sparkchat-complete && node server/index.js

# Terminal 2
cd ~/Desktop/sparkchat-complete && npm run dev
```

---

Built with Next.js 14 + Socket.io + WebRTC + Supabase + Razorpay
Made in India 🇮🇳 Starting from ₹0
