# Spark AI Domain System - Project Structure & Flow Analysis

## 1. Architecture Overview

### Tech Stack
- **Framework**: Next.js 14+ with App Router
- **UI**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based
- **Real-time**: Server-Sent Events (SSE)

### Core Architecture Pattern
```
┌─────────────────┐
│   App Layout    │ ← Wraps entire app
├─────────────────┤
│   Providers     │ ← Context providers (Auth, Domain, Chat, File)
├─────────────────┤
│ Protected Route │ ← Authentication guard
├─────────────────┤
│     Pages       │ ← Actual content
└─────────────────┘
```

## 2. Directory Structure

```
app/
├── api/                    # API Routes (Next.js 14 App Router)
│   ├── auth/              # Authentication endpoints
│   │   ├── login/         # POST - JWT login
│   │   └── register/      # POST - User registration
│   ├── chat/              
│   │   └── stream/        # POST - SSE chat streaming
│   ├── conversations/     # Conversation management
│   ├── posts/             # PostJourney system
│   ├── processes/         # Process definitions
│   └── user/              # User management
│
├── components/            # React components
│   ├── app-layout.tsx     # Main layout wrapper
│   ├── providers.tsx      # Context providers wrapper
│   ├── protected-route.tsx # Auth guard component
│   ├── sidebar.tsx        # Navigation sidebar
│   ├── post-card.tsx      # Post display cards
│   └── chat-interface-v2.tsx # Chat UI with streaming
│
├── contexts/              # React Context providers
│   ├── auth-context.tsx   # Authentication state
│   ├── domain-context.tsx # Domain selection state
│   ├── chat-context.tsx   # Chat session management
│   └── file-context.tsx   # File upload handling
│
├── models/                # MongoDB Mongoose models
│   ├── User.ts           # User with domains & API keys
│   ├── Post.ts           # Master post templates
│   ├── UserPost.ts       # User-specific post assignments
│   ├── Process.ts        # Process definitions with SOPs
│   ├── Conversation.ts   # Chat conversations
│   └── Message.ts        # Chat messages
│
├── lib/                   # Utilities and helpers
│   ├── auth/             # JWT utilities
│   ├── database.ts       # MongoDB connection
│   ├── error-codes.ts    # Standardized error handling
│   └── utils.ts          # General utilities
│
├── types/                 # TypeScript type definitions
│   ├── domain.types.ts   # Domain-related types
│   ├── post.types.ts     # PostJourney types
│   └── process.types.ts  # Process execution types
│
└── [pages]/              # Next.js pages
    ├── page.tsx          # Home (PostJourney display)
    ├── login/            # Authentication
    ├── register/         # User registration
    ├── domains/          # Domain browsing/selection
    └── chat/[id]/        # Chat interface
```

## 3. User Flow

### A. First-Time User Journey
```
1. Landing (/) 
   ↓ No auth token
2. ProtectedRoute redirects → /register
   ↓ User registers
3. Auto-login with JWT
   ↓ No domain selected
4. Redirect → /domains
   ↓ Browse & join domain
5. Domain selected → Home (/)
   ↓ See UserPosts
6. Click post → Chat or process
```

### B. Returning User Journey
```
1. Landing (/)
   ↓ Has auth token
2. Load user from localStorage
   ↓ Fetch fresh data
3. Check domain selection
   ↓ If no domain → /domains
4. Show UserPosts for domain
   ↓ Click post
5. Post → Conversation → Chat
```

### C. PostJourney to Chat Flow
```
1. User clicks UserPost card
   ↓
2. handlePostClick() in page.tsx
   ↓
3. POST /api/posts/[postId]/conversation
   ↓ Check if process has AI
4. Create conversation with SOP context
   ↓
5. Navigate → /chat/[conversationId]
   ↓
6. Load ChatInterfaceV2
   ↓
7. SSE streaming with AI
```

## 4. State Management

### Context Provider Hierarchy
```tsx
<AuthProvider>           // User authentication
  <DomainProvider>       // Domain selection
    <ChatProvider>       // Chat sessions
      <FileProvider>     // File uploads
        {children}
      </FileProvider>
    </ChatProvider>
  </DomainProvider>
</AuthProvider>
```

### Key State Flows

#### Authentication State
- User login/register → JWT tokens
- Tokens stored in localStorage
- Auth header added to all API calls
- User object includes domains array

#### Domain State
- Domains loaded from user object
- Current domain persisted in session
- Navigation filtered by domain
- Posts filtered by domain

#### Chat State
- Recent conversations tracked
- Active chat session
- Message history
- File attachments

## 5. API Routes & Data Flow

### Authentication Flow
```
POST /api/auth/register
→ Create user in MongoDB
→ Generate JWT tokens
→ Return user + tokens

POST /api/auth/login
→ Verify credentials
→ Generate JWT tokens
→ Return user + tokens
```

### PostJourney Flow
```
GET /api/posts?domain=X
→ Get user's UserPosts
→ Filter by domain
→ Include master post data

POST /api/posts/[id]/conversation
→ Check process AI capability
→ Build SOP context
→ Create/get conversation
```

### Chat Flow
```
POST /api/chat/stream
→ Validate auth
→ Get conversation
→ Stream to AI provider
→ SSE response stream
→ Save messages
```

## 6. Key Components

### PostCard
- Displays UserPost data
- Shows progress/completion
- Handles click → process/chat
- Visual priority indicators

### ChatInterfaceV2
- Real-time SSE streaming
- Message history
- File upload support
- Smart message display
- Error handling

### Sidebar
- Domain-aware navigation
- Recent chats section
- User profile
- Mobile responsive

## 7. Data Models & Relationships

```
User ←→ Domains (many-to-many)
  ↓
UserPosts → Posts → Processes
  ↓
Conversations → Messages
```

### Key Collections
- **users**: Authentication & domain membership
- **posts**: Master templates for activities
- **userposts**: User-specific assignments
- **processes**: SOP definitions with AI config
- **conversations**: Chat sessions
- **messages**: Individual chat messages

## 8. SOP Integration (New)

When a UserPost links to an AI-assisted process:

1. **Context Assembly** (`/api/posts/[postId]/conversation/route.ts`)
   - Extracts full SOP from process
   - Includes procedures, roles, compliance
   - Adds required parameters
   - Builds comprehensive system prompt

2. **AI Context includes**:
   - Objective and scope
   - Compliance standards
   - Step-by-step procedures
   - Decision points
   - Role responsibilities
   - Validation rules

3. **Result**: AI has complete procedural knowledge for guidance

## 9. Security & Authentication

- JWT tokens (access + refresh)
- Protected routes require auth
- API routes verify tokens
- User isolation via userId
- Domain access control

## 10. Development Workflow

### Local Development
```bash
npm run dev       # Port 3001
npm run lint      # ESLint
npm run build     # Production build
```

### Database
```bash
# MongoDB on port 27017
mongod --dbpath ~/data/db

# Migrations
npm run migrate:all
npm run seed:posts
```

### Environment Variables
- MongoDB connection
- JWT secrets
- AI provider keys
- Encryption keys