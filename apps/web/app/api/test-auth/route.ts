import { NextResponse } from 'next/server'

export async function GET() {
  const githubId = process.env.GITHUB_ID
  const githubSecret = process.env.GITHUB_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET

  return NextResponse.json({
    status: 'Auth Configuration Test',
    github: {
      clientId: githubId ? `${githubId.substring(0, 10)}...` : 'MISSING',
      clientSecret: githubSecret ? 'SET (hidden)' : 'MISSING',
    },
    nextAuth: {
      url: nextAuthUrl || 'MISSING',
      secret: nextAuthSecret ? 'SET (hidden)' : 'MISSING',
      callbackUrl: `${nextAuthUrl || 'http://localhost:3000'}/api/auth/callback/github`
    },
    instructions: 'Make sure your GitHub OAuth App callback URL matches the callbackUrl above'
  })
}