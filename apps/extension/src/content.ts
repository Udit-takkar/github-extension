function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

window.addEventListener('message', async (event) => {
  if (event.source !== window) return
  if (event.data?.type !== 'GITHUB_AUTH_SUCCESS') return

  if (!isExtensionContextValid()) {
    console.warn('Extension context invalidated, cannot process auth')
    return
  }

  const { token, user } = event.data

  try {
    await chrome.runtime.sendMessage({
      type: 'AUTH_SUCCESS',
      token,
      user,
    })
    console.log('Auth data sent to extension')
  } catch (error) {
    console.error('Failed to send auth data to extension:', error)
  }
})

if (isExtensionContextValid()) {
  console.log('GitHub Notifications content script loaded')
}
