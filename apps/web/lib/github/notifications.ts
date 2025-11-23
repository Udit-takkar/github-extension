import { GitHubClient } from './client'
import { db } from '@/lib/db'
import { notificationThreads } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export interface GitHubNotification {
  id: string
  repository: {
    id: number
    node_id: string
    name: string
    full_name: string
    owner: {
      login: string
      avatar_url: string
    }
  }
  subject: {
    title: string
    url: string | null
    latest_comment_url: string | null
    type: 'Issue' | 'PullRequest' | 'Commit' | 'Release' | 'Vulnerability' | 'Discussion'
  }
  reason: string
  unread: boolean
  updated_at: string
  last_read_at: string | null
  url: string
}

export class NotificationManager {
  private client: GitHubClient
  private userId: string

  constructor(client: GitHubClient, userId: string) {
    this.client = client
    this.userId = userId
  }

  // Fetch and sync notifications with database
  async syncNotifications() {
    try {
      const response = await this.client.getNotifications({
        all: true,
        per_page: 100
      })

      const notifications = response.data as GitHubNotification[]

      // Sync with database
      for (const notification of notifications) {
        const existingThread = await db
          .select()
          .from(notificationThreads)
          .where(eq(notificationThreads.githubThreadId, notification.id))
          .limit(1)

        if (existingThread.length === 0) {
          // Create new notification thread
          await db.insert(notificationThreads).values({
            id: nanoid(),
            userId: this.userId,
            githubThreadId: notification.id,
            repository: notification.repository.full_name,
            subject: {
              title: notification.subject.title,
              url: notification.subject.url,
              type: notification.subject.type
            },
            reason: notification.reason,
            unread: notification.unread,
            lastReadAt: notification.last_read_at ? new Date(notification.last_read_at) : null,
            updatedAt: new Date(notification.updated_at)
          })
        } else {
          // Update existing thread
          await db
            .update(notificationThreads)
            .set({
              unread: notification.unread,
              lastReadAt: notification.last_read_at ? new Date(notification.last_read_at) : null,
              updatedAt: new Date(notification.updated_at)
            })
            .where(eq(notificationThreads.githubThreadId, notification.id))
        }
      }

      return notifications
    } catch (error) {
      console.error('Error syncing notifications:', error)
      throw error
    }
  }

  // Get unread notifications count
  async getUnreadCount() {
    try {
      const response = await this.client.getNotifications({
        all: false,
        per_page: 1
      })

      // GitHub API returns total count in headers
      const linkHeader = response.headers.link
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/)
        if (match) {
          return parseInt(match[1])
        }
      }

      return response.data.length
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  // Mark notification as read
  async markAsRead(threadId: string) {
    try {
      await this.client.markAsRead(threadId)

      // Update database
      await db
        .update(notificationThreads)
        .set({
          unread: false,
          lastReadAt: new Date()
        })
        .where(eq(notificationThreads.githubThreadId, threadId))

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await this.client.markAllAsRead()

      // Update all notifications in database
      await db
        .update(notificationThreads)
        .set({
          unread: false,
          lastReadAt: new Date()
        })
        .where(eq(notificationThreads.userId, this.userId))

      return true
    } catch (error) {
      console.error('Error marking all as read:', error)
      throw error
    }
  }

  // Get notification details with additional context
  async getNotificationDetails(threadId: string) {
    try {
      const thread = await db
        .select()
        .from(notificationThreads)
        .where(eq(notificationThreads.githubThreadId, threadId))
        .limit(1)

      if (thread.length === 0) {
        return null
      }

      const notification = thread[0]
      const subject = notification.subject as any

      // Get additional context based on notification type
      if (subject.type === 'PullRequest' && subject.url) {
        const urlParts = subject.url.split('/')
        const owner = urlParts[4]
        const repo = urlParts[5]
        const pullNumber = parseInt(urlParts[7])

        const pr = await this.client.getPullRequest(owner, repo, pullNumber)
        const reviews = await this.client.getPullRequestReviews(owner, repo, pullNumber)

        return {
          ...notification,
          pullRequest: pr.data,
          reviews: reviews.data
        }
      }

      return notification
    } catch (error) {
      console.error('Error getting notification details:', error)
      throw error
    }
  }
}