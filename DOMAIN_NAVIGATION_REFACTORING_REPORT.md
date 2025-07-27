# Domain Navigation Refactoring Report

## Executive Summary

This report analyzes the current domain navigation architecture in the Spark AI Domain System and proposes a refactoring strategy to implement domain-specific URLs (e.g., `mavens.forus.digital` or `forus.digital/mavens`) as an enhancement to the existing system. The goal is to create a domain-focused experience by adding direct domain URLs while maintaining the current root domain behavior and context system. Domain switching will be de-emphasized by moving it to the user profile dropdown in the right drawer menu.

## Current State Analysis

### Navigation Flow

The current implementation uses a centralized domain context with the following flow:

1. **Initial Landing** (`/`)
   - User lands on home page
   - System checks for `currentDomain` in context
   - If no domain selected → redirects to `/domains`
   - If domain exists → shows domain-filtered content

2. **Domain Selection** (`/domains`)
   - Shows all available domains
   - User can join new domains or switch between joined domains
   - Selection updates `currentDomain` in React context
   - Also persists to `user.currentDomainId` in MongoDB

3. **Post-Selection Experience**
   - All content filtered by `currentDomain`
   - Domain context required for most operations
   - URL remains generic (`/`, `/chat/[id]`, etc.)
   - No domain-specific URLs

### Technical Architecture

#### Domain Context (`/app/contexts/domain-context.tsx`)
- Manages current domain state
- Fetches user's joined domains from auth context
- Provides domain switching functionality
- Persists selection to database via `/api/user/domains`

#### Route Structure
```
/                    → Home (requires domain selection)
/domains             → Domain marketplace/selector
/auth                → Login/Register
/chat/[executionId]  → Task execution chat
/invite/[code]       → Domain invitation flow
/procedures          → Legacy route
/domains/[domainId]/tasks/[masterTaskId] → Task detail
```

#### Key Dependencies
- **Authentication**: User must be logged in for domain context
- **Domain Membership**: Stored in `user.domains` array
- **Current Domain**: Persisted in `user.currentDomainId`
- **API Filtering**: Most endpoints accept `?domain=` parameter

### Current Issues

1. **Domain Selection Prominence**
   - Domain switching is too prominent in the UI
   - Suggests multi-domain usage is primary use case
   - Doesn't reflect single-domain focus

2. **Generic URLs**
   - No domain identity in URLs
   - SEO limitations
   - Poor shareability

3. **Context Dependency**
   - Heavy reliance on React context for domain state
   - Domain switching requires full page context update
   - Potential for context/URL mismatch

4. **Unclear User Journey**
   - Mixed messaging about single vs multi-domain usage
   - Domain marketplace suggests browsing multiple domains
   - Most users will primarily use one domain

## Proposed Architecture

### Option 1: Subdomain-Based Routing

**URL Structure**: `mavens.forus.digital`, `pacci.forus.digital`

#### Implementation Requirements

1. **Infrastructure Changes**
   ```
   - Wildcard DNS: *.forus.digital → App
   - SSL: Wildcard certificate for *.forus.digital
   - CDN: Configure subdomain routing
   ```

2. **Next.js Middleware**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const hostname = request.headers.get('host')
     const subdomain = hostname?.split('.')[0]
     
     if (subdomain && subdomain !== 'www') {
       // Inject domain into request
       request.nextUrl.pathname = `/_domains/${subdomain}${request.nextUrl.pathname}`
     }
   }
   ```

3. **Authentication Adjustments**
   ```typescript
   // Shared session across subdomains
   cookieOptions: {
     domain: '.forus.digital', // Allow all subdomains
     secure: true,
     sameSite: 'lax'
   }
   ```

#### Pros
- True multi-tenant feel
- Domain ownership perception
- Better for white-labeling
- SEO advantages
- Clean URLs

#### Cons
- Complex local development (requires hosts file)
- DNS propagation delays
- Certificate management overhead
- Cross-domain authentication complexity
- CORS considerations for API calls

### Option 2: Path-Based Routing (Recommended)

**URL Structure**: `forus.digital/mavens`, `forus.digital/pacci`

#### Implementation Requirements

1. **Route Structure (Additive)**
   ```
   # Existing routes remain unchanged
   /                            → Current domain home (existing behavior)
   /domains                     → Domain marketplace (existing)
   /tasks                       → Current domain tasks (existing)
   /chat/[executionId]         → Task execution (existing)
   
   # New domain-specific routes (additions)
   /[domain]/                   → Direct domain home
   /[domain]/tasks             → Direct domain tasks
   /[domain]/chat/[executionId] → Direct task execution
   /[domain]/admin             → Domain admin
   ```

2. **Domain Validation Middleware**
   ```typescript
   // app/[domain]/layout.tsx
   export default async function DomainLayout({
     children,
     params
   }: {
     children: React.ReactNode
     params: { domain: string }
   }) {
     const domain = await validateDomain(params.domain)
     if (!domain) notFound()
     
     return (
       <DomainProvider domain={domain}>
         {children}
       </DomainProvider>
     )
   }
   ```

3. **UI Reorganization**
   ```typescript
   // Right drawer structure with de-emphasized domain switching
   <Sidebar>
     {/* Header */}
     <Logo>Forus Spark AI</Logo>
     
     {/* Navigation - domain-specific items */}
     <Navigation>
       <Link href={`/${domain.slug}`}>Home</Link>
       <Link href={`/${domain.slug}/tasks`}>Tasks</Link>
       <Link href={`/${domain.slug}/team`}>Team</Link>
       <Link href={`/${domain.slug}/organogram`}>Organogram</Link>
       <Divider />
       <Link href="/domains">Explore Other Domains</Link>
     </Navigation>
     
     {/* User Profile - Shows current domain instead of email */}
     <UserProfile>
       <Avatar>{user.initials}</Avatar>
       <div>
         <Name>{user.name}</Name>
         <Domain>{currentDomain.name}</Domain> {/* Was: user.email */}
       </div>
       <DropdownMenu>
         <MenuItem>View Profile</MenuItem>
         <MenuItem>Settings</MenuItem>
         <MenuItem onClick={() => router.push('/domains')}>
           Switch Domain
         </MenuItem>
         <MenuItem>Sign Out</MenuItem>
       </DropdownMenu>
     </UserProfile>
   </Sidebar>
   ```

#### Pros
- Simpler implementation
- No infrastructure changes
- Easy local development
- Maintains single origin
- Progressive enhancement path

#### Cons
- Less "ownership" perception
- Potential route conflicts
- Longer URLs
- All domains share same origin

## Implementation Strategy

### Phase 1: Preparation (Current Branch Testing)

Before implementing the refactoring:

1. **Test Current Branch**
   - Validate all domain selection flows
   - Ensure domain persistence works correctly
   - Test domain switching functionality
   - Verify API filtering by domain

2. **Document Current Behavior**
   - User flows through domain selection
   - API endpoints using domain filtering
   - Components dependent on domain context

3. **Identify Breaking Changes**
   - Routes that will move under `/[domain]`
   - API calls needing domain parameter
   - Components using `currentDomain` from context

### Phase 2: Database & UI Preparation

1. **Add Domain Slug**
   ```typescript
   // Domain model addition
   slug: {
     type: String,
     required: true,
     unique: true,
     lowercase: true,
     trim: true,
     match: /^[a-z0-9-]+$/
   }
   ```

2. **Migration Script**
   ```javascript
   // Generate slugs for existing domains
   domains.forEach(domain => {
     domain.slug = domain.name
       .toLowerCase()
       .replace(/\s+/g, '-')
       .replace(/[^a-z0-9-]/g, '')
   })
   ```

3. **UI Component Updates**
   ```typescript
   // Update UserProfile component
   // app/components/user-profile.tsx
   <div className="text-sm font-medium text-gray-900 truncate">
     {user.name}
   </div>
   <div className="text-xs text-gray-600 truncate">
     {currentDomain?.name || 'No domain selected'}
   </div>
   
   // Remove prominent DomainSelector from top of sidebar
   // Move domain switching to user dropdown menu
   ```

### Phase 3: Route Implementation

1. **Create Domain Route Structure**
   ```
   app/
     [domain]/
       layout.tsx        # Domain validation & provider
       page.tsx          # Domain home (current /)
       tasks/
         page.tsx        # Domain tasks
       chat/
         [executionId]/
           page.tsx      # Task execution
       admin/
         page.tsx        # Domain admin
   ```

2. **Update Navigation**
   ```typescript
   // Before
   router.push('/')
   router.push(`/chat/${executionId}`)
   
   // After
   router.push(`/${domain.slug}`)
   router.push(`/${domain.slug}/chat/${executionId}`)
   ```

3. **Root Route Behavior (Unchanged)**
   ```typescript
   // app/page.tsx - REMAINS AS IS
   export default function HomePage() {
     const { currentDomain } = useDomain()
     const router = useRouter()
     
     // Current behavior maintained
     if (!currentDomain) {
       // Redirect to domain selection if no domain
       router.replace('/domains')
     } else {
       // Show current domain's content
       return <DomainHomePage domain={currentDomain} />
     }
   }
   
   // Domain-specific routes are optional alternatives
   // Users can still use / with domain context
   // OR navigate directly to /[domain]/ for bookmarkable URLs
   ```

### Phase 4: Context Simplification

1. **Domain Context Updates**
   ```typescript
   // Domain comes from URL but maintain current domain for UI display
   interface DomainContextType {
     joinedDomains: DomainMembership[]
     currentDomain: Domain | null  // Keep for user profile display
     urlDomain: Domain | null      // Domain from current URL
     joinDomain: (domain: Domain, role: Role) => void
     isJoinedDomain: (domainId: string) => boolean
     getUserRole: (domainId: string) => string | undefined
     setCurrentDomain: (domain: Domain) => void // Updates on navigation
   }
   ```

2. **Domain Page Layout**
   ```typescript
   // app/[domain]/layout.tsx
   export default async function DomainLayout({
     children,
     params
   }: {
     children: React.ReactNode
     params: { domain: string }
   }) {
     const domain = await validateDomain(params.domain)
     if (!domain) notFound()
     
     // Check user has access to this domain
     const hasAccess = await verifyDomainMembership(domain.id)
     if (!hasAccess) redirect('/domains')
     
     return (
       <DomainProvider domain={domain}>
         <DomainHeader domain={domain} />
         {children}
         <RightDrawer /> {/* Contains domain switching */}
       </DomainProvider>
     )
   }
   ```

### Phase 5: Testing & Migration

1. **Testing Strategy**
   - Unit tests for domain slug generation
   - Integration tests for new routes
   - E2E tests for navigation flows
   - Backward compatibility tests

2. **Migration Checklist**
   - [ ] Database migration for slugs
   - [ ] Update all internal navigation
   - [ ] Test domain switching
   - [ ] Verify API compatibility
   - [ ] Update documentation
   - [ ] Configure redirects

## Risk Assessment

### High Risk
- **Breaking existing bookmarks** → Mitigate with redirects
- **API parameter changes** → Maintain backward compatibility
- **Context state issues** → Thorough testing required

### Medium Risk
- **SEO impact** → Submit new sitemap
- **User confusion** → Clear communication
- **Performance impact** → Monitor route resolution

### Low Risk
- **Local development** → Well-documented setup
- **Domain validation** → 404 handling

## Benefits & Outcomes

### Immediate Benefits
1. **Domain-Focused Experience** - Clear single-domain emphasis
2. **Direct Domain Access** - Bookmark and share domain URLs
3. **Cleaner UI** - Domain switching de-emphasized in drawer
4. **Better Analytics** - Track domain-specific metrics
5. **Improved Onboarding** - Users join one domain and stay focused

### Long-Term Benefits
1. **SEO Optimization** - Domain-specific content indexing
2. **White-Label Ready** - Foundation for custom domains
3. **Scalability** - Clear separation of concerns
4. **Migration Path** - Easy transition to subdomains

## Recommendation

**Proceed with Option 2 (Path-Based Routing)** for the following reasons:

1. **Lower Implementation Risk** - No infrastructure changes required
2. **Faster Time to Market** - Can be implemented in current sprint
3. **Progressive Enhancement** - Allows future migration to subdomains
4. **Better Developer Experience** - Simple local development
5. **Maintains Flexibility** - Domain switching remains available

## Next Steps

1. **Complete Current Branch Testing** (fix/onboarding-flow)
2. **Create Feature Branch** for navigation refactoring
3. **Implement Phase 1-2** (Database preparation)
4. **Build POC** of new route structure
5. **Team Review** and refinement
6. **Full Implementation** following phases 3-5

## Conclusion

The proposed refactoring enhances the current system by adding domain-specific URLs while preserving all existing functionality. This hybrid approach provides:

1. **Backward Compatibility** - Root domain behavior remains unchanged
2. **Enhanced Navigation** - Domain-specific URLs for bookmarking and sharing
3. **Maintained Flexibility** - Users can work with either navigation pattern
4. **Progressive Enhancement** - Domain URLs are additive, not replacement
5. **De-emphasized Switching** - Domain selection moves to user profile dropdown

Key principle: **Domain-specific routes are an addition, not a replacement**. Users can continue using `/` with domain context OR navigate to `/[domain]/` for direct access. This approach ensures no disruption to existing workflows while adding powerful new capabilities for domain-focused navigation.