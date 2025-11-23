import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["http://localhost:3000/*"],
  all_frames: true
}

window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return

  if (event.data.type === 'AUTH_SUCCESS') {
    console.log('Content script received AUTH_SUCCESS:', event.data)

    chrome.runtime.sendMessage({
      type: 'AUTH_SUCCESS',
      user: event.data.user
    }).then(() => {
      console.log('Message sent to background script')
    }).catch((error) => {
      console.error('Error sending message:', error)
    })
  }
})

console.log('GitHub Extension: Auth bridge content script loaded')