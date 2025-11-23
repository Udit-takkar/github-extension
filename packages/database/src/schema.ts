import { pgTable, varchar, integer, text, timestamp, boolean, time, jsonb, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 21 }).primaryKey(), // nanoid
  githubId: integer('github_id').unique().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  avatarUrl: text('avatar_url'),
  accessToken: text('access_token'), // encrypted
  refreshToken: text('refresh_token'), // encrypted
  tokenExpiresAt: timestamp('token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: varchar('id', { length: 21 }).primaryKey(),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  pushEnabled: boolean('push_enabled').default(true).notNull(),
  emailEnabled: boolean('email_enabled').default(false).notNull(),
  prReviews: boolean('pr_reviews').default(true).notNull(),
  prMentions: boolean('pr_mentions').default(true).notNull(),
  issueAssignments: boolean('issue_assignments').default(true).notNull(),
  ciStatus: boolean('ci_status').default(false).notNull(),
  quietHoursStart: time('quiet_hours_start'),
  quietHoursEnd: time('quiet_hours_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Notification threads
export const notificationThreads = pgTable('notification_threads', {
  id: varchar('id', { length: 21 }).primaryKey(),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  githubThreadId: varchar('github_thread_id').notNull(),
  repository: varchar('repository').notNull(),
  subject: jsonb('subject').notNull(), // {title, url, type}
  reason: varchar('reason'), // mention, review_requested, etc
  unread: boolean('unread').default(true).notNull(),
  lastReadAt: timestamp('last_read_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Teams
export const teams = pgTable('teams', {
  id: varchar('id', { length: 21 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: varchar('owner_id').references(() => users.id, { onDelete: 'set null' }),
  inviteCode: varchar('invite_code', { length: 10 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Team members
export const teamMembers = pgTable('team_members', {
  teamId: varchar('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.teamId, table.userId] })
}))

// Focus PRs for teams
export const focusPRs = pgTable('focus_prs', {
  id: varchar('id', { length: 21 }).primaryKey(),
  teamId: varchar('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  assignedTo: varchar('assigned_to').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedBy: varchar('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  prUrl: text('pr_url').notNull(),
  prTitle: text('pr_title'),
  repository: varchar('repository'),
  priority: integer('priority').default(0).notNull(),
  dueDate: timestamp('due_date'),
  status: varchar('status').default('pending').notNull(), // pending, reviewing, completed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Push subscriptions
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: varchar('id', { length: 21 }).primaryKey(),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId]
  }),
  notificationThreads: many(notificationThreads),
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
  assignedPRs: many(focusPRs, { relationName: 'assignedTo' }),
  createdPRAssignments: many(focusPRs, { relationName: 'assignedBy' }),
  pushSubscriptions: many(pushSubscriptions)
}))

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id]
  })
}))

export const notificationThreadsRelations = relations(notificationThreads, ({ one }) => ({
  user: one(users, {
    fields: [notificationThreads.userId],
    references: [users.id]
  })
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id]
  }),
  members: many(teamMembers),
  focusPRs: many(focusPRs)
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id]
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  })
}))

export const focusPRsRelations = relations(focusPRs, ({ one }) => ({
  team: one(teams, {
    fields: [focusPRs.teamId],
    references: [teams.id]
  }),
  assignedTo: one(users, {
    fields: [focusPRs.assignedTo],
    references: [users.id],
    relationName: 'assignedTo'
  }),
  assignedBy: one(users, {
    fields: [focusPRs.assignedBy],
    references: [users.id],
    relationName: 'assignedBy'
  })
}))

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id]
  })
}))