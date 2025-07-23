# Spark AI Domain System - Phase 1 Implementation Specification

## Overview
This document provides a complete specification for implementing Phase 1 of the Spark AI Domain System using React and Next.js. Phase 1 focuses on core navigation, domain browsing, and role selection with stubbed content sections.

## Table of Contents
1. [Unified Data Model](#unified-data-model)
2. [Component Architecture](#component-architecture)
3. [Next.js Routing Structure](#nextjs-routing-structure)
4. [State Management](#state-management)
5. [API Contracts](#api-contracts)
6. [Component Specifications](#component-specifications)
7. [User Flows](#user-flows)
8. [Phase 1 Acceptance Criteria](#phase-1-acceptance-criteria)

---

## Unified Data Model

### Core Types (`/types/domain.types.ts`)

```typescript
// Role definition
export interface DomainRole {
  id: string;
  name: string;
  price: string;
  isDefault?: boolean;
  benefits: string[];
}

// Domain definition
export interface Domain {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  cta: string;
  region: string;
  color: string;           // Hex color
  gradient: string;        // Tailwind gradient classes
  hasExistingMembers: boolean;
  joinDetails: {
    minInvestment: string;
    minimumInvestment?: string;  // Optional, only for investment domains
    benefit: string;
  };
  roles: DomainRole[];
}

// User's domain membership
export interface UserDomainMembership {
  domainId: string;
  roleId: string;
}

// User profile
export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'max';
  avatar?: string;
}

// Navigation item
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  domainSpecific: boolean;
}

// Recent activity item
export interface RecentItem {
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  section: string;
  domainId?: string;
}
```

---

## Component Architecture

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Redirects to /domains
│   ├── domains/
│   │   └── page.tsx              # Domain browser
│   ├── workstreams/
│   │   └── page.tsx              # Stubbed
│   ├── teams/
│   │   └── page.tsx              # Stubbed
│   ├── procedures/
│   │   └── page.tsx              # Stubbed
│   ├── tasks/
│   │   └── page.tsx              # Stubbed
│   └── dashboards/
│       └── page.tsx              # Stubbed
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Main navigation sidebar
│   │   ├── DomainSelector.tsx   # Domain dropdown
│   │   ├── NavigationItem.tsx   # Single nav item
│   │   ├── RecentItems.tsx      # Recent activity section
│   │   └── UserProfile.tsx      # User section at bottom
│   ├── domains/
│   │   ├── DomainGrid.tsx       # Grid of domain cards
│   │   ├── DomainCard.tsx       # Individual domain card
│   │   ├── DomainJoinModal.tsx  # Join flow modal
│   │   └── RoleSelector.tsx     # Role selection component
│   └── shared/
│       ├── EmptyState.tsx        # For stubbed sections
│       └── LoadingState.tsx      # Loading indicators
├── contexts/
│   ├── DomainContext.tsx         # Global domain state
│   └── UserContext.tsx           # User authentication state
├── hooks/
│   ├── useDomains.ts             # Domain data fetching
│   └── useNavigation.ts          # Navigation helpers
├── lib/
│   ├── mockData.ts               # Mock domain data
│   └── utils.ts                  # Helper functions
└── types/
    └── domain.types.ts           # TypeScript interfaces
```

---

## Next.js Routing Structure

### App Router Configuration

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <DomainProvider>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </DomainProvider>
        </UserProvider>
      </body>
    </html>
  )
}

// app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/domains')
}
```

### Route Definitions

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to `/domains` |
| `/domains` | DomainBrowser | Browse and join domains |
| `/workstreams` | WorkstreamsStub | Stubbed - shows empty state |
| `/teams` | TeamsStub | Stubbed - shows empty state |
| `/procedures` | ProceduresStub | Stubbed - shows empty state |
| `/tasks` | TasksStub | Stubbed - shows empty state |
| `/dashboards` | DashboardsStub | Stubbed - shows empty state |

---

## State Management

### Global State (Context API)

```typescript
// contexts/DomainContext.tsx
interface DomainContextValue {
  // Current state
  currentDomain: string | null;
  joinedDomains: UserDomainMembership[];
  
  // Actions
  setCurrentDomain: (domainId: string | null) => void;
  joinDomain: (domainId: string, roleId: string) => void;
  leaveDomain: (domainId: string) => void;
  
  // Helpers
  isJoined: (domainId: string) => boolean;
  getUserRole: (domainId: string) => string | undefined;
}

// contexts/UserContext.tsx
interface UserContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### Local Component State

```typescript
// Domain join flow
const [selectedRole, setSelectedRole] = useState<string | null>(null)
const [identityVerified, setIdentityVerified] = useState(false)
const [membershipStatus, setMembershipStatus] = useState<'new' | 'existing'>('new')

// UI state
const [sidebarOpen, setSidebarOpen] = useState(true)
const [domainDropdownOpen, setDomainDropdownOpen] = useState(false)
```

---

## API Contracts

### Mock API Endpoints (Phase 1 - All data is mocked)

```typescript
// GET /api/domains
// Returns all available domains
interface GetDomainsResponse {
  domains: Domain[];
}

// GET /api/user/memberships
// Returns user's domain memberships
interface GetMembershipsResponse {
  memberships: UserDomainMembership[];
}

// POST /api/domains/:domainId/join
// Join a domain with selected role
interface JoinDomainRequest {
  roleId: string;
}
interface JoinDomainResponse {
  success: boolean;
  membership: UserDomainMembership;
}

// GET /api/user/profile
// Get current user profile
interface GetProfileResponse {
  user: User;
}
```

---

## Component Specifications

### 1. Sidebar Component

```typescript
interface SidebarProps {
  className?: string;
}

// Behavior:
// - Toggleable via hamburger menu
// - Shows domain selector at top
// - Filters navigation items based on currentDomain
// - Shows recent items (domain-filtered if domain selected)
// - User profile at bottom
```

### 2. DomainSelector Component

```typescript
interface DomainSelectorProps {
  currentDomain: string | null;
  joinedDomains: UserDomainMembership[];
  onDomainChange: (domainId: string | null) => void;
}

// Behavior:
// - Shows "Join a Domain" when no domain selected
// - Shows domain name, role, region when domain active
// - Dropdown lists joined domains + "Browse all domains"
// - Clicking outside closes dropdown
```

### 3. DomainCard Component

```typescript
interface DomainCardProps {
  domain: Domain;
  isJoined: boolean;
  userRole?: string;
  onClick: () => void;
}

// Behavior:
// - Shows domain icon, name, tagline, CTA
// - Displays role badge if joined
// - Gradient background on hover
// - Shows role count for multi-role domains
```

### 4. DomainJoinModal Component

```typescript
interface DomainJoinModalProps {
  domain: Domain;
  isJoined: boolean;
  userRole?: string;
  onJoin: (roleId: string) => void;
  onClose: () => void;
}

// Behavior:
// - Shows identity verification step
// - Membership status selection (if hasExistingMembers)
// - Role selection grid (if multiple roles)
// - Selected role benefits detail
// - Join/Verify button with dynamic text
```

### 5. RoleSelector Component

```typescript
interface RoleSelectorProps {
  roles: DomainRole[];
  selectedRole: string | null;
  onRoleSelect: (roleId: string) => void;
  disabled?: boolean;
  domainColor: string;
}

// Behavior:
// - Grid layout (1 col mobile, 2 col desktop)
// - Radio button selection
// - Highlights selected role with domain color
// - Shows role name, price, first 2 benefits
// - Disabled state for already joined users
```

---

## User Flows

### Flow 1: New User Journey
```
1. User lands on /domains
2. Sees grid of available domains
3. Clicks domain card → Join modal opens
4. Verifies identity ($10 USD)
5. Selects role (if multiple available)
6. Confirms join → Added to joinedDomains
7. Modal closes, can now access domain
```

### Flow 2: Domain Switching
```
1. User clicks domain selector dropdown
2. Sees list of joined domains
3. Clicks different domain
4. Current domain updates
5. Navigation items update
6. Recent items update
7. Redirected to /workstreams
```

### Flow 3: Accessing Domain Features
```
1. User has domain selected
2. Clicks navigation item (e.g., Tasks)
3. If domain selected → Shows stub content
4. If no domain → Shows "Select domain" message
5. Domain context shown in header
```

---

## Phase 1 Acceptance Criteria

### Core Functionality
- [ ] User can view all available domains in grid layout
- [ ] User can click domain to see join modal
- [ ] User can select role when joining multi-role domain
- [ ] User can complete identity verification step
- [ ] User can join domain and see confirmation
- [ ] Joined domains appear in domain selector dropdown
- [ ] User can switch between joined domains
- [ ] Current domain persists in session

### Navigation
- [ ] Sidebar shows/hides via hamburger menu
- [ ] Navigation items filter based on domain selection
- [ ] "New workstream" always visible
- [ ] Domain-specific items only show with domain selected
- [ ] Recent items update based on current domain
- [ ] User profile shows at sidebar bottom

### Visual/UX
- [ ] Domain cards show gradient on hover
- [ ] Role selection highlights with domain color
- [ ] Dropdown closes when clicking outside
- [ ] Loading states for async operations
- [ ] Empty states for stubbed sections
- [ ] Responsive design (mobile/desktop)

### Stubbed Sections
- [ ] Workstreams page shows "coming soon" with domain context
- [ ] Teams page shows "coming soon" with domain context
- [ ] Procedures page shows "coming soon" with domain context
- [ ] Tasks page shows "coming soon" with domain context
- [ ] Dashboards page shows "coming soon" with domain context

### Data/State
- [ ] Mock data loads for 4 domains (Maven, WoW, Bemnet, PACCI)
- [ ] User memberships persist in session
- [ ] Domain selection persists in session
- [ ] No real API calls (all mocked)
- [ ] TypeScript types match specification

---

## Implementation Notes

1. **Styling**: Use Tailwind CSS for all styling
2. **Icons**: Use emoji for icons (as shown in mock data)
3. **State**: Use Context API for global state (no Redux needed)
4. **Data**: All data is mocked in Phase 1
5. **Persistence**: Use sessionStorage for state persistence
6. **Testing**: Focus on component rendering and user flows

---

## Next Steps (Phase 2)
- Implement real API integration
- Add authentication flow
- Build out content sections
- Add temporal data (joinedAt, lastAccessed)
- Implement membership status states
- Add AI agent functionality