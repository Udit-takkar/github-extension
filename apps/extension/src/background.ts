const POLL_INTERVAL = 30000
const IMPORTANT_REASONS = ['mention', 'review_requested', 'author']

interface Notification {
  id: string
  reason: string
  unread: boolean
  repository: { full_name: string }
  subject: { title: string; type: string; url: string }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('GitHub Notifications extension installed')
})

setInterval(refreshNotifications, POLL_INTERVAL)

async function refreshNotifications() {
  try {
    const stored = await chrome.storage.local.get(['github_token', 'seen_notification_ids'])

    if (!stored.github_token) {
      chrome.action.setBadgeText({ text: '' })
      return
    }

    const response = await fetch('https://api.github.com/notifications', {
      headers: {
        Authorization: `Bearer ${stored.github_token}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch notifications:', response.status)
      return
    }

    const notifications: Notification[] = await response.json()
    const seenIds: string[] = stored.seen_notification_ids || []

    const importantNotifications = notifications.filter(
      n => n.unread && IMPORTANT_REASONS.includes(n.reason)
    )

    const newNotifications = importantNotifications.filter(n => !seenIds.includes(n.id))

    for (const notification of newNotifications) {
      const title = notification.reason === 'mention'
        ? `Mentioned in ${notification.repository.full_name}`
        : notification.reason === 'review_requested'
        ? `Review requested in ${notification.repository.full_name}`
        : `Activity on ${notification.repository.full_name}`

      chrome.notifications.create(notification.id, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title,
        message: notification.subject.title,
        priority: 2
      })
    }

    const allCurrentIds = notifications.map(n => n.id)
    await chrome.storage.local.set({ seen_notification_ids: allCurrentIds })

    const unreadCount = importantNotifications.length
    chrome.action.setBadgeText({
      text: unreadCount > 0 ? String(unreadCount > 99 ? '99+' : unreadCount) : ''
    })
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' })
  } catch (error) {
    console.error('Error refreshing notifications:', error)
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'AUTH_SUCCESS') {
    chrome.storage.local.set({
      github_token: message.token,
      user: message.user,
    }).then(() => {
      refreshNotifications()
      sendResponse({ success: true })
    })
    return true
  }

  if (message.type === 'REFRESH_NOTIFICATIONS') {
    refreshNotifications().then(() => sendResponse({ success: true }))
    return true
  }

  if (message.type === 'TEST_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'GitHub Notifications',
      message: 'This is a test notification!',
      priority: 2
    }, (notificationId) => {
      console.log('Test notification created:', notificationId)
      sendResponse({ success: true, notificationId })
    })
    return true
  }

  if (message.type === 'MOCK_MENTION') {
    const { notification } = message
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: `Mentioned in ${notification.repository.full_name}`,
      message: notification.subject.title,
      priority: 2
    }, (notificationId) => {
      console.log('Mock mention notification created:', notificationId)
      sendResponse({ success: true, notificationId })
    })
    return true
  }
})

refreshNotifications()
