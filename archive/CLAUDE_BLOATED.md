# CLAUDE.md - Forus Spark Project

@/Users/jacquesvandenberg/eos-forus/CLAUDE.md

<hierarchy>
  <level-1>Workspace Guidelines (imported above) - UNIVERSAL RULES</level-1>
  <level-2>Project Guidelines (this file) - PROJECT-SPECIFIC DETAILS</level-2>
</hierarchy>

<critical-reminder>
The imported workspace file contains MANDATORY workflows that must be followed:
- TodoWrite tool usage for all non-trivial tasks
- Lint → Diagnostics → Build workflow after code changes
- BE THE HAMMER principle for proactive tool usage
- Never commit unless explicitly asked
Project-specific guidelines NEVER override workspace guidelines.
</critical-reminder>

This file provides project-specific guidance to Claude Code (claude.ai/code) for the Forus Spark repository.

## CRITICAL: FILES TO READ AND MEMORIZE ON STARTUP

**IMPORTANT**: When starting any conversation about this project, IMMEDIATELY read and store in memory these essential files:

1. **Project Structure Analysis** - `/Users/jacquesvandenberg/eos-forus/digital/app-spark/PROJECT_STRUCTURE_ANALYSIS.md`
   - Complete architecture overview
   - Directory structure and component relationships
   - API routes and data flow
   - State management patterns

2. **User Flow Diagrams** - `/Users/jacquesvandenberg/eos-forus/digital/app-spark/USER_FLOW_DIAGRAM.md`
   - Visual representation of all user journeys
   - Authentication and domain selection flows
   - PostJourney to chat process
   - SOP context assembly flow

3. **Key Implementation Files** (Read when working on specific features):
   - `/app/api/posts/[postId]/conversation/route.ts` - SOP context assembly
   - `/app/page.tsx` - Home page with PostJourney display
   - `/app/contexts/` - All context providers
   - `/app/models/` - MongoDB schema definitions

**WHY**: These files contain the complete mental model of the application. Reading them first prevents mistakes and ensures you understand the full system architecture before making changes.

## Important Context

The Spark AI Domain System implementation is now underway! This project has transitioned from a specification-only repository to an active Next.js application.

### Current Implementation Status (January 2025)

#### SPRINT 1 COMPLETE ✅
- ✅ **Next.js 14+ App Router setup complete** - Initial project scaffolding in place
- ✅ **TypeScript configuration** - Types defined in `app/types/domain.types.ts`
- ✅ **Domain Context Provider** - Implemented in `app/contexts/domain-context.tsx`
- ✅ **Chat Context Provider** - Implemented in `app/contexts/chat-context.tsx` for managing chat sessions
- ✅ **Mock data integration** - Connected via `app/lib/mock-data.ts`
- ✅ **Debug configuration** - VSCode debug launch configured on port 3001
- ✅ **Build system working** - Project builds successfully
- ✅ **Tailwind CSS configured** - Styling system ready
- ✅ **All Sprint 1 Components** - Implemented and tested
- ✅ **Mobile-first responsive design** - Overlay sidebar, compact cards, touch-optimized
- ✅ **Process template system** - Process cards launch chat interfaces
- ✅ **Chat interface** - Basic chat UI for process execution
- ✅ **Recent chats tracking** - Sidebar shows recent chat sessions

#### SPRINT 2 FOUNDATION (January 2025) - COMPLETE ✅
- ✅ **Authentication System** - JWT-based auth with MongoDB integration
- ✅ **User Management** - User model with login/registration
- ✅ **API Key Management** - Create, read, delete API keys with encryption
- ✅ **SSE Chat Streaming** - Real-time message streaming with Server-Sent Events
- ✅ **Enhanced Chat Interface** - ChatInterfaceV2 with authentication and streaming
- ✅ **Auth Context Provider** - Manages user state across the application
- ✅ **LibreChat Integration** - Core components adapted from LibreChat
- ✅ **MongoDB Migration Package** - Complete migration from mock data to MongoDB (January 2025)
- ✅ **Chat Interface Navigation** - Post-to-chat flow with conversation management (January 2025)
- ✅ **Conversation API** - Full CRUD operations for conversations and messages (January 2025)

The project has successfully integrated LibreChat's authentication and streaming capabilities, providing a solid foundation for Sprint 2's execution models implementation. Additionally, a comprehensive MongoDB migration package has been created to transition from mock data to persistent database storage. The chat interface navigation is now fully functional with proper conversation management.

## Project Overview

The Spark AI Domain System is a multi-role, multi-domain enterprise platform that enables users to join industry-specific ecosystems (domains), select roles, and access domain-specific features. The project uses React, Next.js 14+ with App Router, TypeScript, and Tailwind CSS.

## Development Commands

```bash
# Development server (PORT 3001)
npm run dev        # Start development server on port 3001 (managed by VSCode debug)
npm run build      # Build for production
npm run start      # Start production server on port 3001
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking

# Check all diagnostics (TypeScript, ESLint, etc.)
# Use mcp__ide__getDiagnostics tool in Claude Code (read workspace CLAUDE.md)

# VSCode Debug
# Use "App Spark: debug full stack" configuration (F5)
# Debug server runs on http://localhost:3001
```

### Environment Setup
Create a `.env.local` file with:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/spark-ai

# JWT Secrets (change in production)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key

# Session Secret
SESSION_SECRET=your-session-secret

# API Keys Encryption
CREDS_KEY=your-32-character-encryption-key
CREDS_IV=your-16-character-iv

# AI Provider Keys (optional for demo)
OPENAI_API_KEY=your-openai-api-key
```

### Port Configuration
This project is configured to run on **port 3001** to avoid conflicts with other Forus projects:
- app-value runs on port 3000
- app-spark runs on port 3001
- Future projects will use 3002, 3003, etc.

## Architecture and Key Concepts

### Domain-Driven Design
- **Domains**: Industry-specific ecosystems (Maven Hub, Wealth on Wheels, Bemnet, PACCI)
- **Roles**: Each domain has specific roles with different benefits/pricing
- **Context-Aware Navigation**: Navigation adapts based on selected domain
- **Session Persistence**: Domain selections persist across page refreshes

### Sprint-Based Development
- **Sprint 1 (COMPLETE)**: MVP with domain browsing, role selection, process templates, chat interface
- **Sprint 2 (Future)**: Real process execution with 5 execution models, AI agent assistance, smart contracts

### Sprint 2: The 5 Execution Models (CRITICAL)

The Process Execution System is built around 5 fundamental execution models that define how work gets done:

1. **Form Model** - Structured data collection and validation
   - Fixed fields with validation rules
   - Step-by-step data entry
   - Can be fully automated once patterns are learned
   - Example: Investor Profile Creation, Savings Goal Planning

2. **SOP Model (Standard Operating Procedures)** - Compliance and risk mitigation
   - Checklist-driven execution with mandatory sequences
   - Real-time compliance tracking and deviation alerts
   - Comprehensive audit trail generation
   - Risk assessment at each step
   - Example: Project Registration Process, Vehicle Compliance Verification

3. **Knowledge Model** - Information retrieval and analysis
   - Query-based interaction
   - Dynamic responses with context awareness
   - Pattern analysis and insight generation
   - Example: Investment Opportunity Analysis, Credit Score Calculation

4. **BPMN Model** - Complex business process workflows
   - Multi-step processes with decision points
   - Parallel execution paths
   - Integration with external systems
   - Example: Daily Fleet Route Planning, Trade Finance Application

5. **Training Model** - Educational and skill development processes
   - Progressive learning paths
   - Assessment and certification
   - Personalized content delivery
   - Example: Driver Safety Training

### AI Agent Maturity Stages
Processes evolve through 4 maturity stages:
- **Manual**: Human executes without AI help
- **Assisted**: AI helps but human does the work
- **Supervised**: AI does the work but human supervises
- **Automated**: AI has generated code/workflows that run independently

**The Goal**: AI Promotion - when an AI agent learns enough to generate executable artifacts, it's promoted to higher-value work.

### Key Technical Decisions
1. **Mock-First Development**: Complete mock data before API integration
2. **XML Specifications**: Machine-readable specs for AI-assisted development
3. **Minimalist Design**: Clean, typography-first design with subtle interactions
4. **Component Architecture**: Reusable React components with TypeScript

## Current Implementation Structure

### App Directory (Next.js 14+ App Router)
```
app/
├── api/                      # ✅ API Routes (NEW)
│   ├── auth/
│   │   ├── login/route.ts    # JWT login endpoint
│   │   └── register/route.ts # User registration endpoint
│   ├── chat/
│   │   └── stream/route.ts   # SSE chat streaming endpoint
│   └── keys/route.ts         # API key management endpoints
├── components/               # ✅ React components (EXPANDED)
│   ├── app-layout.tsx        # Main layout with sidebar/mobile menu
│   ├── sidebar.tsx           # Collapsible sidebar with mobile overlay
│   ├── domain-card.tsx       # Domain display cards
│   ├── domain-grid.tsx       # Domain cards grid layout
│   ├── domain-join-modal.tsx # Join domain flow modal
│   ├── domain-selector.tsx   # Domain switcher dropdown
│   ├── process-card.tsx      # Process template cards
│   ├── chat-interface.tsx    # Basic chat UI (Sprint 1)
│   ├── chat-interface-v2.tsx # Enhanced chat with SSE streaming (NEW)
│   ├── api-keys-panel.tsx    # API key management UI (NEW)
│   ├── recent-items.tsx      # Recent chats display
│   ├── role-selector.tsx     # Role selection component
│   ├── user-profile.tsx      # User profile widget
│   ├── navigation-item.tsx   # Nav link component
│   └── empty-state.tsx       # Empty state display
├── contexts/                 # ✅ State management (EXPANDED)
│   ├── domain-context.tsx    # Domain state management
│   ├── chat-context.tsx      # Chat session management
│   └── auth-context.tsx      # Authentication state (NEW)
├── domains/                  # ✅ Domain browsing page
│   └── page.tsx
├── lib/
│   ├── auth/
│   │   └── jwt.ts           # JWT utilities (NEW)
│   ├── database.ts          # MongoDB connection (NEW)
│   ├── mock-data.ts         # Mock data from specifications
│   ├── sprint2-mock-data/   # Sprint 2 process data
│   └── utils.ts             # Utility functions
├── login/                   # ✅ Authentication pages (NEW)
│   └── page.tsx
├── register/                # ✅ Authentication pages (NEW)
│   └── page.tsx
├── models/                  # ✅ Database models (NEW)
│   └── User.ts              # User model with API keys
├── types/
│   └── domain.types.ts      # TypeScript type definitions
├── globals.css              # Global styles with Tailwind
├── layout.tsx               # Root layout with auth provider
└── page.tsx                 # Home page with process cards
```

### Configuration Files
- `.vscode/launch.json` - Debug configuration for port 3001
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration (with downlevelIteration for generators)
- `package.json` - Dependencies and scripts
- `.env.local` - Environment variables (create from template above)

### Key Dependencies Added (Sprint 2 Foundation)
```json
{
  "dependencies": {
    // Authentication
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    
    // Database
    "mongoose": "^8.16.3",
    
    // Session Management
    "express-session": "^1.18.1",
    "cookie-parser": "^1.4.7",
    
    // Real-time Streaming
    "sse.js": "^2.6.0",
    
    // Configuration
    "dotenv": "^17.2.0"
  }
}
```

## File Structure and Key Files

### Specifications (Start Here)
- `sprints/sprint1/specs/sprint1-spec.xml` - Sprint 1 requirements with acceptance criteria
- `docs/developer/developer-checklist.md` - Step-by-step implementation guide
- `sprints/sprint1/mock-data/mock-data.ts` - All mock data with TypeScript types
- `docs/design/styling-guide.md` - Minimalist design system

### Component Examples
- `sprints/sprint1/components/unified-domain-ui.tsx` - Complete UI implementation example
- `sprints/sprint1/components/minimalist-component-examples.tsx` - Clean component patterns

### Important Navigation Details
- "Organogram" appears in navigation above "Workstreams"
- Navigation items only show when a domain is selected
- All content sections are stubbed with "Coming Soon" in Sprint 1

## Implementation Approach

When implementing features:

1. **Check XML Specifications First**: Use `sprint1-spec.xml` for accurate requirements
2. **Follow the Developer Checklist**: Use acceptance criteria IDs (e.g., AC-001) to track progress
3. **Use Mock Data**: All data comes from `mock-data.ts` in Phase 1
4. **Apply Minimalist Design**: Follow styling guide for clean, elegant interfaces
5. **Test Against Acceptance Criteria**: Each feature has specific test cases in XML

## Common Tasks

### Adding a New Component
1. Check existing component examples for patterns
2. Use TypeScript interfaces from specifications
3. Follow minimalist design principles
4. Connect to domain context if needed

### Working with Domain Context
```typescript
// Import the custom hook (not the context directly)
import { useDomain } from '@/app/contexts/domain-context';

// Use the hook in components
const { 
  currentDomain,      // Current selected domain object
  currentDomainId,    // Current domain ID string
  joinedDomains,      // Array of user's domain memberships
  setCurrentDomain,   // Function to change current domain
  joinDomain,         // Function to join a new domain
  isJoinedDomain,     // Check if user has joined a domain
  getUserRole         // Get user's role in a domain
} = useDomain();
```

**Note**: The context provider is already wrapped in the root layout, so all components have access to domain state.

### Implementing Navigation
- Filter navigation items by `currentDomain?.id`
- Hide items when no domain is selected
- Maintain active states based on current route

## Testing Approach

For Sprint 1, focus on:
- Component renders correctly
- Domain selection updates UI
- Navigation filters work
- State persists on refresh
- Responsive design works

## IMMUTABLE USER FLOW - SPRINT 1 COMPLETE

### THIS FLOW IS LOCKED AND MUST NOT BE CHANGED

#### 1. Initial Landing
- User lands on app → Redirected to `/domains` if no domain selected
- Mobile users see hamburger menu in top left
- Desktop users see collapsible sidebar (defaults to collapsed)

#### 2. Domain Selection Flow
- User browses domain cards on `/domains` page
- Each card shows: domain name, description, member count, roles available, region chip
- Clicking a domain card:
  - If not joined → Opens join modal
  - If already joined → Navigates to home with that domain selected

#### 3. Domain Join Flow
- Modal opens with 3 steps (new members only):
  1. Role selection
  2. Identity verification (simulated)
  3. Confirmation
- After joining → Auto-navigates to home page
- Domain is now selected and persisted in session

#### 4. Home Page (Domain Dashboard)
- Shows pinned domain banner with gradient
- Displays process cards for selected domain
- Process cards show:
  - Process name and type icon
  - Execution model label (hidden on mobile)
  - Current stage badge (Manual/AI Assisted/etc)
  - AI Agent availability (if applicable)
  - "Start Process" CTA with arrow

#### 5. Process Execution Flow
- User clicks process card → Chat interface opens
- Chat covers full screen (mobile and desktop)
- New chat is added to recent items in sidebar
- User can have conversation with AI assistant (simulated responses)
- Close button (X) returns to home page

#### 6. Navigation Structure
- Sidebar (overlay on mobile, static on desktop):
  - Spark branding
  - Domain selector dropdown (when expanded)
  - Navigation items (filtered by selected domain)
  - Recent chats section (shows 5 most recent)
  - User profile at bottom
- Mobile: Hamburger menu top left opens overlay sidebar
- All navigation items except Domains show "Coming Soon"

#### 7. Persistence
- Selected domain persists across refreshes (session storage)
- Joined domains persist in session storage
- Recent chats persist in session storage (max 10)
- Sidebar collapse state is transient (resets on refresh)

### IMPORTANT: This flow is complete and immutable for Sprint 1. Any changes require Sprint 2 planning.

## Important Notes

1. **No API Calls**: Everything uses mock data in Phase 1
2. **Stubbed Sections**: All content pages show "Coming Soon"
3. **Session Storage**: Use for state persistence, not localStorage
4. **Domain Gradients**: Each domain has specific gradient classes (preserve these)
5. **Role IDs**: Use role IDs, not names, for identification
6. **Process Cards**: These are TEMPLATES, not instances - they launch new chats
7. **Chat Sessions**: Tracked in recent items, simulated responses only
8. **Mobile Design**: Compact cards, overlay sidebar, full-screen chat

## Sprint 2 Implementation Status

### Completed Foundation Work:
- ✅ **Authentication System**: JWT-based auth with login/registration
- ✅ **User Management**: MongoDB user model with secure password hashing
- ✅ **API Key System**: Users can create/manage API keys for programmatic access
- ✅ **Chat Streaming**: SSE-based real-time message streaming
- ✅ **Enhanced Chat UI**: ChatInterfaceV2 with auth and streaming support

### Ready for Sprint 2 Implementation:
- **Process Execution System**: Implement the 5 execution models
- **AI Agent Integration**: Connect to OpenAI, Anthropic, etc.
- **Smart Contract Integration**: Value distribution mechanisms
- **Domain Application Workflow**: Full application process
- **AI Agent Promotion**: Track agent learning and promotion

**CRITICAL**: The 5 execution models (Form, SOP, Knowledge, BPMN, Training) are the foundation of Sprint 2. Each model has specific characteristics and AI integration patterns. Process cards displayed in Sprint 1 are templates that will launch into these execution models in Sprint 2.

## Chat Interface Navigation Flow (January 2025)

The chat interface navigation is now fully functional with proper conversation management. Here's the complete flow:

### Post-to-Chat Flow
1. **User clicks on a post** → `handlePostClick` in `app/page.tsx`
   - Logs post details and processId
   - Marks post as viewed via API call
   - Checks if post has a processId

2. **Creates/retrieves conversation** → POST to `/api/posts/[postId]/conversation`
   - Validates user authentication with JWT
   - Retrieves UserPost and verifies ownership
   - Checks if UserPost has a processId
   - Validates Process exists and is AI-assisted (`aiAgentAttached: true`)
   - Creates new conversation or returns existing one
   - Links conversation to UserPost via `userPostId`

3. **Redirects to chat** → `/chat/[conversationId]`
   - Router navigates to chat page with conversation ID
   - Chat page loads with conversation context

4. **Loads conversation** → GET from `/api/conversations/[conversationId]`
   - Validates user authentication
   - Retrieves conversation details
   - Verifies conversation ownership

5. **Loads existing messages** → GET from `/api/conversations/[conversationId]/messages`
   - Retrieves all messages for the conversation
   - Formats messages for chat interface
   - Handles empty conversation with welcome message

6. **Displays chat interface** → `ChatInterfaceV2` component
   - Shows conversation title and process context
   - Displays message history
   - Enables real-time SSE streaming for new messages
   - Provides input field for user interaction

### Technical Implementation Details

#### API Routes
- `/api/posts/[postId]/conversation` (POST) - Create/retrieve conversation for a post
- `/api/conversations/[conversationId]` (GET) - Get conversation details
- `/api/conversations/[conversationId]/messages` (GET) - Get conversation messages
- `/api/chat/stream` (POST) - SSE streaming for real-time chat

#### Key Components
- `app/page.tsx` - Home page with post cards and click handlers
- `app/chat/[conversationId]/page.tsx` - Chat page wrapper
- `app/components/chat-interface-v2.tsx` - Main chat interface component
- `app/services/conversations.ts` - Conversation and message services
- `app/models/Conversation.ts` - Conversation MongoDB model
- `app/models/Message.ts` - Message MongoDB model

#### Database Collections
- `userposts` - User-specific post assignments with processId
- `processes` - Process definitions with AI agent configuration
- `conversations` - Chat conversation metadata
- `messages` - Individual chat messages

#### Authentication Flow
All API routes use JWT authentication:
- Access token passed in Authorization header
- Token verified using `verifyAccessToken` function
- User ID extracted from JWT payload (`decoded.id`)
- Database queries filtered by user ID for security

### Authentication Flow
1. User registers/logs in via `/login` or `/register`
2. JWT tokens generated (access + refresh)
3. Auth context provides user state throughout app
4. API calls include Bearer token in Authorization header
5. Chat streaming requires authentication (falls back to demo mode)

### Chat Streaming Architecture
1. User clicks process card → ChatInterfaceV2 opens
2. Messages sent to `/api/chat/stream` with auth token
3. SSE connection established for real-time streaming
4. AI responses stream word-by-word to UI
5. Chat sessions tracked in context with domain/process info

## Design System Quick Reference

**Note: This project uses its own design tokens. For Forus-wide UI component standards, read the workspace CLAUDE.md.**

### Colors (Spark-specific)
- Primary: Grays (#FAFAFA to #171717)
- Accent: Green (#16A34A)
- Text: Gray-900 for primary, Gray-600 for secondary

### Typography
- Font: System font stack
- Headings: Font-light with ample spacing
- Body: Font-normal with 1.6-1.8 line height

### Spacing
- Use Tailwind's spacing scale consistently
- Generous padding (p-6 to p-8 common)
- Large gaps between sections (gap-8 to gap-12)

### Components
- Subtle shadows (shadow-sm)
- Light borders (border-gray-200)
- Smooth transitions (300ms ease)
- Hover states should be subtle

## Integration with Forus Cognee

In Phase 2, this project will integrate with mcp-cognee-local for AI agent memory capabilities:
- Domain contexts will be stored in Cognee
- User interactions will build agent memory
- Process execution will leverage learned patterns

## MongoDB Database Management

### MongoDB MCP Server Configuration
This project includes the official MongoDB MCP server for direct database access:
- **Official Server**: [github.com/mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server)
- **Configuration**: `.mcp.json` in project root (includes `--readOnly` flag for safety)
- **Connection**: `mongodb://localhost:27017/spark-ai`
- **Activation**: Restart Claude Code to load MCP tools
- **Tools Prefix**: `mcp__mongodb__` for all database operations

For comprehensive MongoDB MCP tool documentation, see the workspace CLAUDE.md VSCode MCP Tools section.

### Key Collections
```
users                    # User accounts and authentication
├── _id                 # MongoDB ObjectId
├── email               # Unique user email
├── domains[]           # Array of joined domains
└── identity            # Verification status

domains                 # Domain configurations (migrated from mock data)
├── domainId           # Unique domain identifier (e.g., 'maven-hub')
├── name               # Display name
├── availableRoles[]   # Roles with pricing and benefits
├── navigation[]       # Domain-specific navigation items
└── features[]         # Domain features list

processes              # Process templates (migrated from mock data)
├── processId         # Unique process identifier
├── domainId          # Associated domain
├── executionModel    # Type: form, sop, knowledge, bpmn, training
├── currentStage      # Maturity: manual, assisted, supervised, automated, ai_promoted
└── aiAgentAttached   # Boolean for AI agent presence

posts                   # Master post templates
├── _id                # MongoDB ObjectId  
├── domain             # Domain identifier ('all', 'maven-hub', etc.)
├── postType           # Type of post (onboarding, training, etc.)
└── nextPosts[]        # Posts to assign on completion

userposts              # User-specific post assignments
├── userId             # References users._id
├── postId             # References posts._id
├── isCompleted        # Boolean completion status
└── isHidden           # Boolean visibility status
```

### Common MongoDB MCP Operations
```javascript
// Find user by email
mcp__mongodb__find({
  collection: "users",
  query: { email: "user@example.com" }
})

// Update user verification
mcp__mongodb__update-one({
  collection: "users",
  filter: { _id: "userId" },
  update: { $set: { "identity.isVerified": true } }
})

// Get user's posts
mcp__mongodb__find({
  collection: "userposts",
  query: { userId: "userId" }
})
```

### MongoDB Compass
For visual database exploration:
- Install: `brew install --cask mongodb-compass`
- Connect to: `mongodb://localhost:27017/spark-ai`
- Database Path: `/Users/jacquesvandenberg/data/db`
- Features: Schema visualization, document editing, query builder

**Connection Instructions:**
1. Open MongoDB Compass
2. Use connection string: `mongodb://localhost:27017/spark-ai`
3. Or connect with: Host: `localhost`, Port: `27017`
4. Select database: `spark-ai` (not admin or local)
5. You should see 7 collections: users, domains, processes, posts, messages, userposts, conversations

### MongoDB Server Setup

#### Installation Location
MongoDB is installed at: `/Users/jacquesvandenberg/eos-forus/mongodb-macos-aarch64-8.0.11/`

#### Starting MongoDB
```bash
# Start MongoDB server (if not already running)
/Users/jacquesvandenberg/eos-forus/mongodb-macos-aarch64-8.0.11/bin/mongod \
  --dbpath ~/data/db \
  --port 27017 \
  --bind_ip 127.0.0.1 &
```

#### Checking MongoDB Status
```bash
# Check if MongoDB is running
ps aux | grep mongod | grep -v grep

# Verify port 27017 is listening
lsof -i :27017 | grep LISTEN
```

#### Stopping MongoDB
```bash
# Find the MongoDB process ID
ps aux | grep mongod | grep -v grep

# Kill the process (replace PID with actual process ID)
kill PID
```

### Database Seeding

#### Seed Script Location
The database seed script is located at: `scripts/seed-posts.ts`

#### Running the Seed Script
```bash
# From the project root
npm run seed:posts

# Or directly with tsx
npx tsx scripts/seed-posts.ts
```

#### Other Database Scripts
- `scripts/assign-domain-posts.ts` - Assigns posts to users based on their domains
- `scripts/check-user-posts.ts` - Checks user post assignments
- `scripts/debug-user-posts.ts` - Debug tool for user posts
- `scripts/test-api-detailed.ts` - Detailed API testing
- `scripts/test-posts-api.ts` - Posts API testing

The seed script creates:
- Identity verification post (universal - all users)
- Domain-specific posts for Maven Hub, Wealth on Wheels, PACCI, and Bemnet
- Proper post relationships with prerequisites and next posts

### MongoDB Data Migration Package

#### Overview
A comprehensive migration package has been created to move all mock data from TypeScript files to MongoDB:
- Location: `scripts/` directory
- Purpose: Transition from mock data to persistent database storage
- Status: Fully operational and tested

#### Migration Scripts
1. **`migrate-domains.ts`** - Migrates 4 domains with roles, navigation, and features
2. **`migrate-processes.ts`** - Migrates 10 processes across 5 execution models
3. **`migrate-all.ts`** - Master script that runs all migrations in order
4. **`README.md`** - Complete documentation for the migration package

#### Running Migrations
```bash
# Ensure MongoDB is running on port 27017
# Run complete migration (domains + processes)
npm run migrate:all

# Or run individually
npm run migrate:domains    # Just domains
npm run migrate:processes  # Just processes (requires domains)
npm run seed:posts        # Seed posts (separate from migration)
```

#### Migration Results
- **4 Domains**: Maven Hub, Wealth on Wheels, Bemnet, PACCI
- **10 Processes** with various execution models:
  - 2 Form processes (data collection)
  - 2 SOP processes (standard procedures)
  - 3 Knowledge processes (information retrieval)
  - 2 BPMN processes (complex workflows)
  - 1 Training process (education)
- **8 AI Agents** attached to processes
- **1 AI-Promoted Process** (Daily Fleet Route Planning)

#### Data Transformation
The migration scripts handle:
- Converting mock data format to MongoDB schema
- Adding navigation items per domain
- Generating training curricula and form fields
- Creating rich metadata for AI agents
- Setting up process metrics with sample data

### MongoDB Troubleshooting

#### Common Issues

1. **"Connection refused" error**
   - MongoDB is not running - start it using the command above
   - Check if another process is using port 27017

2. **MCP tools not working**
   - Restart Claude Code after adding `.mcp.json`
   - Ensure Node.js version is 20.10.0+ (check with `node --version`)
   - Verify MongoDB is running on port 27017

3. **Data not appearing in Compass**
   - Ensure you're connected to the correct database: `spark-ai`
   - Run the seed script if collections are empty
   - Refresh the connection in Compass

4. **Port 27017 already in use**
   - Check what's using it: `lsof -i :27017`
   - If it's an old MongoDB process, kill it and restart

### Current MongoDB Status (January 2025)
- MongoDB server installed at: `/Users/jacquesvandenberg/eos-forus/mongodb-macos-aarch64-8.0.11/`
- Data directory: `/Users/jacquesvandenberg/data/db`
- Running on: `localhost:27017`
- Database: `spark-ai`
- Collections populated: domains (4), processes (1), posts (9), userposts, conversations, messages
- MongoDB MCP server: Configured and operational

## MEMORY INSTRUCTIONS FOR CLAUDE

### When Starting Work on This Project:
1. **FIRST ACTION**: Read `PROJECT_STRUCTURE_ANALYSIS.md` and `USER_FLOW_DIAGRAM.md`
2. **UNDERSTAND**: The complete application flow before making any changes
3. **REFERENCE**: These files when answering questions about architecture
4. **USE**: The documented patterns and conventions in all new code

### Key Concepts to Remember:
- **PostJourney System**: Posts → UserPosts → Processes → Conversations
- **SOP Context**: Full procedural knowledge passed to AI assistants
- **Domain Isolation**: Users work within selected domains
- **JWT Auth**: All API routes require authentication
- **SSE Streaming**: Real-time chat responses

## PostJourney System and AI Context (January 2025)

### Overview
The PostJourney system creates personalized user experiences by assigning posts to users based on their domain membership and prerequisites. When posts link to AI-assisted processes, the system now uses the full SOP (Standard Operating Procedure) as the source of truth for AI context.

### Data Flow
1. **Master Posts** (`posts` collection) - Templates that may reference a `processId`
2. **UserPosts** (`userposts` collection) - User-specific post assignments with progress tracking
3. **Process Execution** - When user clicks a post with a process:
   - System checks if process has `aiAgentAttached: true`
   - Creates/retrieves conversation with full SOP context
   - AI assistant receives comprehensive procedural knowledge

### SOP as Context Source
The system now includes the complete SOP in AI context:
- **Objective and Scope** - What's included/excluded, who it applies to
- **Policies and Compliance** - Standards, regulations, compliance requirements
- **Roles and Responsibilities** - Who does what in the process
- **Detailed Procedures** - Step-by-step instructions with decision points
- **Required Parameters** - Information to collect with validation rules
- **Process Metadata** - Risk level, duration, compliance standards

### Implementation Details
- **Location**: `/api/posts/[postId]/conversation/route.ts`
- **Key Change**: Enhanced context assembly uses `process.standardOperatingProcedure` field
- **Fallback**: If no SOP exists, uses basic process information
- **Result**: AI has full procedural knowledge for compliance and guidance

### Example: Identity Verification Process
The identity verification SOP includes:
- 8 detailed procedures with decision points
- 4 roles (User, AI Processor, Compliance Officer, System Admin)
- Compliance standards (KYC, AML, FICA, POPIA)
- Document authenticity checks and risk assessments
- Audit trail requirements

This ensures the AI assistant can properly guide users through complex compliance processes while maintaining regulatory standards.

Read `/Users/jacquesvandenberg/eos-forus/CLAUDE.md` for workspace-level development standards and tool usage.