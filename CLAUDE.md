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

## CRITICAL: FILES TO READ ON STARTUP

**IMMEDIATELY READ these files for complete system understanding:**

1. **PROJECT_STRUCTURE_ANALYSIS.md** - Architecture, directories, API routes, data flow
2. **USER_FLOW_DIAGRAM.md** - User journeys and state management
3. **Key Files**: `/app/api/posts/[postId]/conversation/route.ts` (SOP context assembly)

## RESOLVED ISSUES (January 2025)

### 1. ✅ Double Refresh Issue 
- Fixed by adding proper domain redirect logic
- Tailwind spin animation added to config

### 2. ✅ OAuth-Ready Auth
- Unified `/auth` page implemented
- Removed localStorage-based first-time user detection

### 3. ✅ User Verification Persistence
- Fixed to use `identity.isVerified` (nested structure)
- All components now use correct field path
- Database properly updates nested identity object

## Project Overview

Multi-role, multi-domain enterprise platform using:
- Next.js 14+ App Router, TypeScript, Tailwind CSS
- MongoDB with JWT auth and SSE streaming
- Port 3001

## Development

```bash
npm run dev        # Port 3001
npm run build      # Production build
npm run lint       # ESLint
npm run migrate:all # Run MongoDB migrations
npm run seed:posts  # Seed data
```

### Environment (.env.local)
```env
MONGODB_URI=mongodb://localhost:27017/spark-ai
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
SESSION_SECRET=your-session-secret
CREDS_KEY=your-32-character-encryption-key
CREDS_IV=your-16-character-iv
OPENAI_API_KEY=your-openai-api-key
```

## Key Concepts

### PostJourney System (UPDATED January 2025)
Posts → UserPosts → Processes → Conversations → Messages

**CRITICAL CHANGE**: User-Initiated Post Assignment
- NO automatic post assignment on registration or domain join
- ALL posts (including identity verification) must be clicked to assign
- Users see unassigned posts with "Assign" badge
- Master posts API includes both domain-specific and universal (domain='all') posts

### Variable Naming Convention
**In Code:**
- `userPosts` = User's assigned posts (UserPosts collection from DB)
- `unassignedPosts` = Master post templates not yet assigned (Posts collection from DB)

**Database Collections:**
- `posts` = Master post templates
- `userposts` = User-specific instances

### User Flow Changes
1. User registers/logs in → NO posts auto-assigned
2. Navigate to home → See ALL posts as unassigned
3. Click any post → Assigns to user → Navigate to process detail page
4. Process detail page → Shows intro → Start button (if verified)
5. Click Start → Creates conversation → Navigate to chat

### 5 Execution Models (Sprint 2)
1. **Form** - Structured data collection
2. **SOP** - Standard Operating Procedures with compliance
3. **Knowledge** - Information retrieval
4. **BPMN** - Complex workflows
5. **Training** - Educational processes

### SOP Context (Current Focus)
- Full SOP passed to AI in `/api/posts/[postId]/conversation/route.ts`
- Includes: objectives, scope, procedures, roles, compliance, decision points
- Ensures AI has complete procedural knowledge

## MongoDB Schema

```
users → domains (many-to-many)
posts → processes (optional link)
userposts → conversations → messages
```

### Key Collections
- **users**: Auth & domain membership
- **posts**: Master templates
- **userposts**: User assignments
- **processes**: SOPs with AI config
- **conversations**: Chat sessions
- **messages**: Chat history

### User Data Structure (CRITICAL)
The user object has a **nested identity structure**:
```javascript
{
  id: string,
  email: string,
  name: string,
  currentDomainId: string,
  domains: Array<{domainId, role, joinedAt}>,
  identity: {
    isVerified: boolean,      // ← CORRECT: identity.isVerified
    verifiedAt?: Date,
    verificationType?: string,
    verificationLevel?: string
  }
}
```

**IMPORTANT**: Always use `user.identity.isVerified`, NOT `user.isVerified`

### Persistence Pattern
All user data follows the same persistence pattern:
1. **Domains**: `user.domains` array → MongoDB & localStorage
2. **Current Domain**: `user.currentDomainId` → MongoDB & localStorage  
3. **Verification**: `user.identity.isVerified` → MongoDB & localStorage

All three persist across:
- Page refreshes
- Browser restarts
- Session restores via refresh tokens

## Critical Paths

### Auth Flow (TO BE SIMPLIFIED)
Current: Register/Login → JWT → Domain Selection → Home
Future: /auth → JWT → Domain Selection → Home

### Post-to-Chat Flow (UPDATED January 2025)
1. Click Post (assigned or unassigned)
2. If unassigned → Assign to user first
3. Navigate to `/process/[processId]` (process detail page)
4. Show process intro and details
5. If requires verification && !verified → Show locked message
6. If can start → User clicks "Start Process"
7. Create conversation with SOP context
8. Navigate to `/chat/[conversationId]` → SSE streaming

## MongoDB Operations

```bash
# Start MongoDB
mongod --dbpath ~/data/db --port 27017

# MongoDB Compass
mongodb://localhost:27017/spark-ai
```

## Remember
- Users work within selected domains
- All API routes require JWT auth
- SOP is the source of truth for AI context
- Read analysis files for implementation details
- Fix double refresh issue first (quick win)
- Then implement OAuth-ready auth (better UX)

## Recent Changes (January 2025)

### User-Initiated Post Assignment
- Removed ALL automatic post assignments (including identity verification)
- Users must click posts to assign them
- Shows "Assign" badge on unassigned posts
- Master posts API now includes universal posts (domain='all')

### Process Detail Page
- New intermediate page at `/process/[processId]`
- Shows process intro, description, and metadata
- Verification check before allowing process start
- Locked message if identity verification required

### Variable Naming Cleanup
- Renamed `posts` → `userPosts` (assigned posts)
- Renamed `masterPosts` → `unassignedPosts` (not yet assigned)
- Matches database collection naming convention

### Tailwind Fix
- Added missing `spin` animation to tailwind.config.ts
- Fixes non-spinning loader issue

### Identity Verification Fix (CRITICAL - January 2025)
- **Problem**: User verification was using flat `user.isVerified` instead of nested `user.identity.isVerified`
- **Solution**: Updated entire codebase to use `user.identity.isVerified`
- **Files Updated**:
  - Auth context: Uses nested identity object
  - Home page: Checks `user?.identity?.isVerified`
  - Process detail page: Checks `user?.identity?.isVerified`
  - Chat interface: Only updates verification for identity posts
  - Post journey service: Updates `identity.isVerified` in MongoDB
  - Debug popup: Shows correct nested structure
- **Persistence**: Verification status now properly persists like domains and currentDomainId

### Chat Interface Enhancements (January 2025)

#### Real-time Token & Cost Tracking
- **LLM Provider Chip**: Shows "Gemini 1.5 Flash" 
- **Token Count Chip**: Displays "Usage" when 0, otherwise shows animated count
- **Cost Chip**: Shows cost with 2 decimal places, animated updates
- **Technical Debt**: 
  - Token counts are estimated (word count * 1.3)
  - Pricing is hardcoded ($0.15/1M input, $0.60/1M output tokens)
  - Should use Gemini API's `usageMetadata` for accurate counts
  - LLM provider should be configurable per process

#### Simplified Identity Verification
- **Direct Handling**: Submit button on ID verification directly updates user state
- **No Chat Stream**: Identity verification completes without sending to chat API
- **Immediate Redirect**: Shows success message and redirects home after 2 seconds
- **ProcessID Support**: Other processes send `[ProcessID: ${processId}]` to chat

#### Fixed Infinite Loop Issue
- **Problem**: `SmartMessageDisplay` had `onDataExtract` in useEffect dependencies
- **Solution**: Removed from dependencies, memoized callback functions
- **Result**: Artifact displays properly without "Maximum update depth exceeded" error

#### SOP Popup Copy Button
- **Added Copy Functionality**: Formats entire SOP as readable text
- **Visual Feedback**: Shows green checkmark for 2 seconds after copying
- **Consistent Pattern**: Follows same UI pattern as other popup copy buttons