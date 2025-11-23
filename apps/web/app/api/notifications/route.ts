import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { GitHubClient } from '@/lib/github/client'
import { NotificationManager } from '@/lib/github/notifications'

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.substring(7)
    return { accessToken, userId: 'extension-user' }
  }

  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return {
      accessToken: (session as any).accessToken,
      userId: session.user.id
    }
  }

  return null
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)

    if (!auth || !auth.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = new GitHubClient(auth.accessToken)
    const notificationManager = new NotificationManager(client, auth.userId)

    const notifications = await notificationManager.syncNotifications()

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)

    if (!auth || !auth.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    const client = new GitHubClient(auth.accessToken)
    const notificationManager = new NotificationManager(client, auth.userId)

    if (action === 'mark-all-read') {
      await notificationManager.markAllAsRead()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing notification action:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}