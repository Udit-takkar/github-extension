import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

// Store active connections
const clients = new Map<string, ReadableStreamDefaultController>()

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const stream = new ReadableStream({
    start(controller) {
      // Store this client's controller
      clients.set(userId, controller)

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
          clients.delete(userId)
        }
      }, 30000)

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.delete(userId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable Nginx buffering
    }
  })
}

// Helper function to send updates to specific user
export function sendUpdateToUser(userId: string, data: any) {
  const controller = clients.get(userId)
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      // Client disconnected
      clients.delete(userId)
    }
  }
}