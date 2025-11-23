import { Octokit } from '@octokit/rest'
import { graphql } from '@octokit/graphql'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { decrypt } from '@/lib/auth/encryption'

export class GitHubClient {
  private octokit: Octokit
  private graphqlClient: typeof graphql

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken
    })

    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${accessToken}`
      }
    })
  }

  async getUser() {
    return this.octokit.users.getAuthenticated()
  }

  async getNotifications(options: {
    all?: boolean
    participating?: boolean
    since?: string
    before?: string
    per_page?: number
  } = {}) {
    return this.octokit.activity.listNotificationsForAuthenticatedUser({
      all: options.all || false,
      participating: options.participating || false,
      since: options.since,
      before: options.before,
      per_page: options.per_page || 50
    })
  }

  async markAsRead(threadId: string) {
    return this.octokit.activity.markThreadAsRead({
      thread_id: parseInt(threadId)
    })
  }

  async markAllAsRead() {
    return this.octokit.activity.markNotificationsAsRead({
      last_read_at: new Date().toISOString()
    })
  }

  async getPullRequest(owner: string, repo: string, pull_number: number) {
    return this.octokit.pulls.get({
      owner,
      repo,
      pull_number
    })
  }

  async getPullRequestReviews(owner: string, repo: string, pull_number: number) {
    return this.octokit.pulls.listReviews({
      owner,
      repo,
      pull_number
    })
  }

  async getReviewRequests(username: string) {
    const query = `
      query GetReviewRequests($login: String!) {
        user(login: $login) {
          pullRequests(first: 100, states: OPEN) {
            nodes {
              id
              title
              url
              number
              repository {
                name
                owner {
                  login
                }
              }
              createdAt
              updatedAt
              author {
                login
                avatarUrl
              }
              reviewRequests(first: 10) {
                nodes {
                  requestedReviewer {
                    ... on User {
                      login
                      avatarUrl
                    }
                    ... on Team {
                      name
                      avatarUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    return this.graphqlClient(query, { login: username })
  }

  async getUserEvents(username: string) {
    return this.octokit.activity.listReceivedEventsForUser({
      username,
      per_page: 100
    })
  }

  async searchIssuesAndPRs(query: string) {
    return this.octokit.search.issuesAndPullRequests({
      q: query,
      sort: 'updated',
      order: 'desc'
    })
  }
}

export async function getGitHubClientForUser(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user[0] || !user[0].accessToken) {
    throw new Error('User not found or no access token available')
  }

  const accessToken = user[0].accessToken.includes(':')
    ? decrypt(user[0].accessToken)
    : user[0].accessToken

  return new GitHubClient(accessToken)
}