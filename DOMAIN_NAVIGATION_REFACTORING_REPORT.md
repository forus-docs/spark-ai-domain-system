# Domain Navigation Refactoring Report

## Executive Summary

This report analyzes the current domain navigation architecture in the Spark AI Domain System and proposes a refactoring strategy to implement domain-specific URLs (e.g., `mavens.forus.digital` or `forus.digital/mavens`). The goal is to transform domain selection from a forced navigation flow into an optional feature while maintaining backward compatibility.

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
/domains/[domainId]/processes/[processId] → Process detail
```

#### Key Dependencies
- **Authentication**: User must be logged in for domain context
- **Domain Membership**: Stored in `user.domains` array
- **Current Domain**: Persisted in `user.currentDomainId`
- **API Filtering**: Most endpoints accept `?domain=` parameter

### Current Issues

1. **Forced Navigation Flow**
   - Users must select a domain before accessing content
   - Interrupts user journey with domain selection
   - Can't bookmark/share domain-specific content

2. **Generic URLs**
   - No domain identity in URLs
   - SEO limitations
   - Poor shareability

3. **Context Dependency**
   - Heavy reliance on React context for domain state
   - Domain switching requires full page context update
   - Potential for context/URL mismatch

4. **Limited Multi-Domain Workflow**
   - Can't easily work across multiple domains
   - Tab-based workflows not supported
   - Domain switching is disruptive

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

1. **Route Restructuring**
   ```
   /[domain]/                    → Domain home
   /[domain]/tasks              → Domain tasks
   /[domain]/chat/[executionId] → Task execution
   /[domain]/admin              → Domain admin
   /domains                     → Domain marketplace (unchanged)
   /account                     → User account (domain-agnostic)
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

3. **Context Refactoring**
   ```typescript
   // Remove currentDomain state management
   // Domain comes from URL, not state
   const { domain } = useParams()
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

### Phase 2: Database Preparation

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

3. **Backward Compatibility**
   ```typescript
   // app/page.tsx
   export default function HomePage() {
     const { user } = useAuth()
     const router = useRouter()
     
     useEffect(() => {
       if (user?.currentDomainId) {
         // Redirect to user's current domain
         const domain = user.domains.find(d => d.domainId === user.currentDomainId)
         if (domain) {
           router.replace(`/${domain.slug}`)
         }
       } else {
         router.replace('/domains')
       }
     }, [user])
   }
   ```

### Phase 4: Context Refactoring

1. **Simplify Domain Context**
   ```typescript
   // Remove currentDomain state management
   // Keep only domain membership and utilities
   interface DomainContextType {
     joinedDomains: DomainMembership[]
     joinDomain: (domain: Domain, role: Role) => void
     isJoinedDomain: (domainId: string) => boolean
     getUserRole: (domainId: string) => string | undefined
   }
   ```

2. **Create Domain Route Context**
   ```typescript
   // For domain-specific routes
   interface DomainRouteContextType {
     domain: Domain
     userRole: Role
     isAdmin: boolean
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
1. **Direct Domain Access** - Bookmark and share domain URLs
2. **Multi-Domain Workflows** - Work across domains in tabs
3. **Improved UX** - No forced navigation flow
4. **Better Analytics** - Track domain-specific metrics

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

The proposed refactoring transforms domain selection from a blocking requirement to an enhanced navigation feature. By implementing path-based routing, we can deliver immediate value while maintaining a clear path to subdomain-based architecture when business requirements justify the additional complexity.

This approach aligns with Forus principles by removing friction from the user journey while enhancing the platform's capability to serve multiple domain ecosystems effectively.