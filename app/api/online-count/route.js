import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/online-count`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ count: 2847 })
  }
}
