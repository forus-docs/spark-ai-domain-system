# Persistence State Management Analysis - Spark AI

## Overview
This document analyzes all state variables and mechanisms used for persistence in the Spark AI codebase.

## 1. Browser Storage Persistence

### localStorage
Used for client-side persistence that survives browser sessions.

#### Auth Context (`app/contexts/auth-context.tsx`)
- **`accessToken`**: JWT access token
  - Set on login/register
  - Retrieved on app mount
  - Cleared on logout
- **`user`**: User object with all user data
  - Contains: id, email, domains[], currentDomainId, identity
  - Updated when domains change
  - Updated when currentDomainId changes

#### Domain Context (`app/contexts/domain-context.tsx`)
- **`user.currentDomainId`**: Currently selected domain
  - Updated via localStorage when user changes domain
  - Synced with database via API call

#### Protected Route (`app/components/protected-route.tsx`)
- **`spark_has_visited`**: First-time user flag
  - Set to 'true' after first visit
  - Used to redirect new users to domains page

### sessionStorage
**NOT CURRENTLY USED** - Was removed in favor of database persistence

## 2. Database Persistence (MongoDB)

### User Model (`app/models/User.ts`)
- **`currentDomainId`**: User's currently selected domain
- **`domains[]`**: Array of joined domains with roles
- **`identity`**: Verification status
- **`apiKeys[]`**: API keys for programmatic access

### UserPost Model (`app/models/UserPost.ts`)
- **`isHidden`**: Whether post is hidden from feed
- **`isCompleted`**: Whether post task is completed
- **`completedAt`**: Timestamp of completion
- **`isViewed`**: Whether user has clicked the post
- **`assignedAt`**: When post was assigned to user

### Conversation Model (`app/models/Conversation.ts`)
- **`conversationId`**: Unique conversation identifier
- **`userPostId`**: Links conversation to UserPost
- **`messages[]`**: Array of message references
- **`systemPrompt`**: Full context for AI

### Message Model (`app/models/Message.ts`)
- **`content`**: Message text
- **`role`**: user/assistant/system
- **`tokenCount`**: Usage tracking

## 3. Cookie Persistence

### Refresh Token
- **`refreshToken`**: HTTP-only secure cookie
  - Set on login/register
  - Used for token refresh
  - Expires in 7 days
  - HttpOnly, Secure, SameSite=Strict

## 4. State Flow Analysis

### Initial Load Flow
1. App mounts → AuthContext checks localStorage
2. If tokens exist → Load user from localStorage
3. Fetch fresh user data from API (domains, currentDomain)
4. Update localStorage with fresh data
5. DomainContext reads user.currentDomainId
6. ChatContext loads recent conversations from API

### Domain Selection Persistence
1. User selects domain → DomainContext.setCurrentDomain()
2. API call to update database (PUT /api/user/domains)
3. Update localStorage user object with new currentDomainId
4. Domain persists across sessions

### Post Completion Persistence
1. User completes task → Submit button clicked
2. Message sent with [PostID: xxx]
3. API detects PostID → Updates UserPost in database
4. Sets isHidden=true, isCompleted=true
5. Post hidden from future feeds

### Chat Persistence
1. Conversations stored in database
2. Loaded on demand via API
3. Recent chats loaded in ChatContext
4. No client-side chat persistence

## 5. Component State (Non-Persistent)

### Home Page (`app/page.tsx`)
- **`posts`**: Current posts array (fetched from API)
- **`isLoading`**: Loading state
- **`showHidden`**: Toggle for showing hidden posts

### Chat Interface (`app/components/chat-interface-v2.tsx`)
- **`messages`**: Current conversation messages
- **`isStreaming`**: SSE streaming state
- **`showPostCompletedSpinner`**: 5-second spinner display
- **`attachedFiles`**: Temporary file attachments

## 6. Key Persistence Patterns

### 1. Hybrid Approach
- **Immediate**: localStorage for instant UI updates
- **Authoritative**: Database as source of truth
- **Sync**: Regular sync between localStorage and database

### 2. Optimistic Updates
- Update UI immediately (localStorage)
- Sync to database in background
- Handle failures gracefully

### 3. Session vs Permanent
- **Session**: Active UI state (selected files, open modals)
- **Permanent**: User preferences, completed tasks, domains

### 4. Security Considerations
- Sensitive data (tokens) in httpOnly cookies where possible
- API validates all state changes server-side
- Client state is convenience, not security

## 7. State Persistence Summary

| State | Storage | Lifetime | Sync |
|-------|---------|----------|------|
| Access Token | localStorage | Until logout | No |
| Refresh Token | Cookie | 7 days | No |
| User Data | localStorage + DB | Permanent | Yes |
| Current Domain | localStorage + DB | Permanent | Yes |
| Post Status | DB only | Permanent | No |
| Conversations | DB only | Permanent | No |
| Recent Chats | Memory + DB | Session | On load |
| First Visit Flag | localStorage | Permanent | No |

## 8. Recommendations

1. **Consider moving tokens to httpOnly cookies** for better security
2. **Implement state reconciliation** for conflicts between localStorage and DB
3. **Add offline support** with service workers and IndexedDB
4. **Implement state versioning** for migrations
5. **Add telemetry** for persistence failures