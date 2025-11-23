'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function AuthSuccessPage() {
  const { data: session, status } = useSession()
  const [message, setMessage] = useState('Authenticating...')

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated' && session?.user) {
      setMessage('✅ Authentication successful!')

      // Send message to extension
      window.postMessage({
        type: 'AUTH_SUCCESS',
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          accessToken: (session as any).accessToken
        }
      }, '*')

      // Close window after 2 seconds
      setTimeout(() => {
        window.close()
      }, 2000)
    } else {
      setMessage('❌ Authentication failed. Please try again.')
    }
  }, [session, status])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
        GitHub Notifications Extension
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        {message}
      </p>
      {status === 'authenticated' && (
        <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
          You can close this window
        </p>
      )}
    </div>
  )
}