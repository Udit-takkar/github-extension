import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, webhooks } from '@/lib/github/webhooks'

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-hub-signature-256')
    const event = req.headers.get('x-github-event')
    const deliveryId = req.headers.get('x-github-delivery')

    if (!signature || !event) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const body = await req.text()

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log(`Webhook event: ${event}, delivery: ${deliveryId}`)

    // Process webhook
    await webhooks.verifyAndReceive({
      id: deliveryId!,
      name: event as any,
      signature: signature,
      payload: body
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}