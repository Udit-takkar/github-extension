# GitHub Notifications Chrome Extension

A powerful Chrome extension that provides real-time GitHub notifications with team collaboration features and push notifications support.

## Features

- **Real-time Notifications**: Get instant updates about your GitHub activity
- **Push Notifications**: Desktop notifications for important events
- **Team Collaboration**: Focus board for PR reviews (coming soon)
- **Smart Filtering**: Filter notifications by type, repository, and status
- **OAuth Authentication**: Secure GitHub login
- **Offline Support**: Cached data for offline viewing

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Extension**: Plasmo Framework
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with GitHub OAuth
- **Real-time**: Server-Sent Events (SSE) / WebSockets (free alternatives to Pusher)
- **GitHub API**: Octokit

## Setup Instructions

### Prerequisites

- Node.js 18+ and Bun
- Docker and Docker Compose
- GitHub OAuth App
- PostgreSQL database

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/github-extension.git
cd github-extension
```

### 2. Install Dependencies

```bash
# Install main project dependencies
bun install

# Install extension dependencies
cd extension
bun install
cd ..
```

### 3. Setup Database

**Option A: Using npm scripts (Recommended)**

Start PostgreSQL with Docker:

```bash
bun run docker:up
```

Run database migrations:

```bash
bun run db:generate
bun run db:push
# When prompted, select "Yes, I want to execute all statements"
```

> **Note:** The `db:push` command will show you the SQL statements and ask for confirmation. Type `Yes` to create the tables.

**Option B: Quick setup script**

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Option C: Manual Docker commands**

```bash
docker compose up -d
```

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and update:

```env
# Database
DATABASE_URL="postgresql://admin:secure_password_change_in_production@localhost:5432/github_extension"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-secret-here"

# GitHub OAuth App
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"

# Real-time Updates (using SSE - no external service needed)
# SSE is built-in and free, no configuration required

# Web Push (for notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="generate-vapid-keys"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:your-email@example.com"

# GitHub Webhook Secret
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Encryption Secret
ENCRYPTION_SECRET="32-byte-hex-string-for-token-encryption"
```

### 5. Create GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: `GitHub Notifications Extension`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Save and copy the Client ID and Client Secret to `.env.local`

### 6. Generate VAPID Keys

```bash
bunx web-push generate-vapid-keys
```

Copy the generated keys to `.env.local`

### 7. Start Development Servers

Start the Next.js development server:

```bash
bun dev
```

In another terminal, start the extension development:

```bash
cd extension
bun dev
```

### 8. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension/build/chrome-mv3-dev` directory
5. The extension icon should appear in your toolbar

## Usage

### First Time Setup

1. Click the extension icon in Chrome toolbar
2. Click "Sign in with GitHub"
3. Authorize the OAuth application
4. Configure your notification preferences

### Features

#### Notifications Tab
- View all GitHub notifications
- Mark as read/unread
- Quick actions to open in GitHub
- Real-time updates

#### Focus Tab (Coming Soon)
- Team PR review assignments
- Priority queue of PRs to review
- Due dates and assignments

#### Settings Tab
- Configure notification types
- Set quiet hours
- Manage push notifications

## Development

### Project Structure

```
/github-extension
├── /app                 # Next.js app
│   ├── /api            # API routes
│   ├── /dashboard      # Web dashboard
│   └── /auth          # Auth pages
├── /extension          # Chrome extension
│   ├── /popup         # Extension popup UI
│   ├── /background    # Service worker
│   └── /assets       # Icons and assets
├── /lib               # Shared libraries
│   ├── /db           # Database schema
│   ├── /github       # GitHub API helpers
│   ├── /auth         # Authentication
│   └── /pusher       # Real-time updates
└── /components        # UI components
```

### API Endpoints

- `GET /api/notifications` - Fetch notifications
- `PATCH /api/notifications/[id]` - Mark as read
- `POST /api/webhooks/github` - GitHub webhook receiver
- `POST /api/push/subscribe` - Subscribe to push notifications

### Docker Commands

**PostgreSQL Container:**
```bash
bun run docker:up            # Start PostgreSQL container
bun run docker:down          # Stop PostgreSQL container
bun run docker:logs          # View PostgreSQL logs
bun run docker:restart       # Restart PostgreSQL container
bun run docker:clean         # Remove container and volumes (⚠️ deletes data)
```

**Database Management:**
```bash
bun run db:generate          # Generate Drizzle migrations
bun run db:push              # Push schema to database
bun run db:studio            # Open Drizzle Studio (GUI)
```

**Quick Start:**
```bash
# One-command setup
./scripts/setup.sh

# Manual setup
bun install
bun run docker:up
bun run db:generate
bun run db:push
bun dev
```

### Database Schema

The app uses PostgreSQL with the following main tables:

- `users` - User accounts and tokens
- `notification_preferences` - User settings
- `notification_threads` - Cached notifications
- `teams` - Team management
- `focus_prs` - Team PR assignments
- `push_subscriptions` - Web push endpoints

## Deployment

### Production Setup

1. Deploy Next.js app to Vercel/Railway/etc
2. Setup production PostgreSQL database
3. Configure production environment variables
4. Build extension for production: `cd extension && bun build`
5. Submit to Chrome Web Store

### Security Considerations

- All tokens are encrypted before storage
- Webhook signatures are verified
- OAuth state validation
- Rate limiting on API endpoints
- Content Security Policy headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: your-email@example.com

## Roadmap

- [ ] Team collaboration features
- [ ] Advanced notification filtering
- [ ] Mobile companion app
- [ ] GitHub Actions integration
- [ ] Slack/Discord integration
- [ ] Analytics dashboard
- [ ] Custom notification rules