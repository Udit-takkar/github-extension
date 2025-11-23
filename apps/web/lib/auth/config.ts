import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email notifications repo read:org'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        console.log('✅ JWT Callback - Account received:', {
          provider: account.provider,
          access_token: account.access_token ? 'PRESENT' : 'MISSING',
          type: account.type
        })
        token.accessToken = account.access_token
        token.githubId = profile?.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return `${baseUrl}/auth/success`
      else if (url.startsWith('/')) return `${baseUrl}${url}`
      return url
    }
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      username?: string
      githubId?: number
      email: string | null
      name: string | null
      image: string | null
    }
  }

  interface Profile {
    id: number
    login: string
    avatar_url: string
    email: string
  }
}