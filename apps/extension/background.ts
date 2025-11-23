import { Storage } from '@plasmohq/storage'

const storage = new Storage()

console.log('GitHub Notifications Extension - Background script loaded')

chrome.alarms.create('poll-notifications', {
  periodInMinutes: 1
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'poll-notifications') {
    pollNotifications()
  }
})

async function pollNotifications() {
  console.log('Polling notifications...')
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_SUCCESS') {
    console.log('Background received AUTH_SUCCESS:', message.user)

    storage.set('user', message.user).then(() => {
      console.log('User data stored successfully')
      sendResponse({ success: true })

      chrome.action.setBadgeText({ text: '✓' })
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' })

      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' })
      }, 3000)
    }).catch((error) => {
      console.error('Error storing user:', error)
      sendResponse({ success: false, error })
    })

    return true
  }
})

pollNotifications()

export {}