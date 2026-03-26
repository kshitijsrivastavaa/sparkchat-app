import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userId } = await request.json()

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Save payment to DB
    await supabase.from('payments').insert({
      user_id: userId,
      razorpay_order_id,
      razorpay_payment_id,
      amount: plan === 'spark_pro' ? 1000 : 2500,
      plan,
      status: 'success'
    })

    // Update user to premium
    await supabase.from('users').update({
      is_premium: true,
      premium_expires_at: expiresAt.toISOString()
    }).eq('id', userId)

    return NextResponse.json({ success: true, expiresAt })
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
