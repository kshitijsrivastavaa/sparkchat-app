import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const PLANS = {
  spark_pro: { amount: 1000, description: 'Spark Pro Weekly' },  // ₹10 in paise = 1000
  pro_plus:  { amount: 2500, description: 'Pro Plus Weekly' },   // ₹25 in paise = 2500
}

export async function POST(request) {
  try {
    const { plan, userId } = await request.json()

    if (!PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { amount, description } = PLANS[plan]

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { plan, userId }
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Razorpay order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
