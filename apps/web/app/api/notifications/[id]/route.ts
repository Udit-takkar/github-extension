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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req)

    if (!auth || !auth.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = new GitHubClient(auth.accessToken)
    const notificationManager = new NotificationManager(client, auth.userId)

    const details = await notificationManager.getNotificationDetails(params.id)

    if (!details) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error('Error fetching notification details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req)

    if (!auth || !auth.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = new GitHubClient(auth.accessToken)
    const notificationManager = new NotificationManager(client, auth.userId)

    await notificationManager.markAsRead(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}