import { useState, useEffect } from 'react'
import { Storage } from '@plasmohq/storage'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogClose,
} from '@repo/ui/alert-dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/card'
import { Separator } from '@repo/ui/separator'
import { Spinner } from '@repo/ui/spinner'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@repo/ui/tabs'
import './style.css'

const storage = new Storage()
const API_BASE_URL = 'http://localhost:3000/api'

interface Notification {
  id: string
  repository: {
    full_name: string
  }
  subject: {
    title: string
    type: string
    url: string
  }
  reason: string
  unread: boolean
  updated_at: string
}

interface User {
  id: string
  email: string
  name: string
  image: string
  accessToken: string
}

function IndexPopup() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications')

  useEffect(() => {
    const handleStorageChange = (newValue: unknown) => {
      if (newValue) {
        console.log('User data updated in storage:', newValue)
        setUser(newValue)
        setLoading(false)
        fetchNotifications(newValue)
      }
    }

    loadUser()

    storage.watch({
      user: handleStorageChange
    })

    return () => {
      storage.unwatch({
        user: handleStorageChange
      })
    }
  }, [])

  const loadUser = async () => {
    try {
      const userData = await storage.get('user')
      if (userData) {
        setUser(userData)
        await fetchNotifications(userData)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async (userData?: unknown) => {
    const currentUser = (userData || user) as User | null
    if (!currentUser?.accessToken) return

    setLoadingNotifications(true)
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)

        const unreadCount = data.filter((n: Notification) => n.unread).length
        if (unreadCount > 0) {
          chrome.action.setBadgeText({ text: unreadCount.toString() })
          chrome.action.setBadgeBackgroundColor({ color: '#0969da' })
        } else {
          chrome.action.setBadgeText({ text: '' })
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleLogin = () => {
    chrome.tabs.create({
      url: 'http://localhost:3000/api/auth/signin'
    })
  }

  const handleRefresh = () => {
    fetchNotifications()
  }

  const handleMarkAsRead = async (threadId: string) => {
    if (!user?.accessToken) return

    try {
      await fetch(`${API_BASE_URL}/notifications/${threadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        }
      })

      await fetchNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleOpenNotification = (notification: Notification) => {
    if (notification.subject.url) {
      chrome.tabs.create({
        url: notification.subject.url.replace('api.github.com/repos', 'github.com')
      })

      if (notification.unread) {
        handleMarkAsRead(notification.id)
      }
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <Spinner className="size-8" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <Card className="auth-container">
          <CardHeader className="text-center">
            <div className="icon">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </div>
            <CardTitle>GitHub Notifications</CardTitle>
            <CardDescription>Sign in to receive real-time GitHub notifications</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleLogin} size="lg">
              Sign in with GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="user-info">
          <Avatar className="size-10">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="user-details">
            <span className="username">{user.name || user.email}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="ghost" size="icon" title="Refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 16h5v5"/>
          </svg>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'notifications' | 'settings')}>
        <TabsList className="w-full">
          <TabsTab value="notifications" className="flex-1">
            Notifications
            {notifications.filter(n => n.unread).length > 0 && (
              <Badge variant="default" size="sm" className="ml-2">
                {notifications.filter(n => n.unread).length}
              </Badge>
            )}
          </TabsTab>
          <TabsTab value="settings" className="flex-1">
            Settings
          </TabsTab>
        </TabsList>

        <TabsPanel value="notifications" className="notifications-list">
          {loadingNotifications ? (
            <div className="loading-inline">
              <Spinner className="size-4" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
                <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.518 1.518 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z"/>
              </svg>
              <p>No notifications</p>
              <span>You&apos;re all caught up!</span>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.unread ? 'unread' : ''}`}
                onClick={() => handleOpenNotification(notification)}
              >
                <div className="notification-indicator">
                  {notification.unread && <div className="unread-dot"></div>}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <span className="notification-repo">{notification.repository.full_name}</span>
                    <span className="notification-time">
                      {new Date(notification.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="notification-title">{notification.subject.title}</div>
                  <div className="notification-meta">
                    <Badge variant="info" size="sm" className="notification-type">
                      {notification.subject.type}
                    </Badge>
                    <span className="notification-reason">{notification.reason.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsPanel>

        <TabsPanel value="settings" className="settings">
          <h3>Notification Settings</h3>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>PR review requests</span>
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Mentions</span>
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Issue assignments</span>
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" />
              <span>CI/CD status updates</span>
            </label>
          </div>

          <Separator className="my-6" />

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Danger Zone</h4>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Clear All Notifications</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will mark all notifications as read and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogClose>
                  <AlertDialogClose asChild>
                    <Button variant="destructive">Yes, clear all</Button>
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  )
}

export default IndexPopup