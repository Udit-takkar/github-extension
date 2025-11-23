import { createHmac } from 'crypto'
import { Webhooks } from '@octokit/webhooks'

const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'development-secret'

export const webhooks = new Webhooks({
  secret: webhookSecret
})

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expectedSignature = `sha256=${createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')}`

  return signature === expectedSignature
}

webhooks.on('pull_request', async ({ payload }) => {
  console.log('Pull request event:', payload.action)

  switch (payload.action) {
    case 'opened':
      break
    case 'review_requested':
      break
    case 'closed':
      break
  }
})

webhooks.on('pull_request_review', async ({ payload }) => {
  console.log('Pull request review event:', payload.action)

  switch (payload.action) {
    case 'submitted':
      break
    case 'edited':
      break
  }
})

webhooks.on('issues', async ({ payload }) => {
  console.log('Issue event:', payload.action)

  switch (payload.action) {
    case 'opened':
      break
    case 'assigned':
      break
  }
})

webhooks.on('issue_comment', async ({ payload }) => {
  console.log('Issue comment event:', payload.action)

  if (payload.action === 'created') {
    const mentions = extractMentions(payload.comment.body)
  }
})

webhooks.on('push', async ({ payload }) => {
  console.log('Push event to:', payload.ref)
})

webhooks.on('workflow_run', async ({ payload }) => {
  console.log('Workflow run:', payload.action, payload.workflow_run.status)

  if (payload.action === 'completed') {
  }
})

function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9-]+)/g
  const matches = text.matchAll(mentionRegex)
  return Array.from(matches).map(match => match[1])
}

export default webhooks