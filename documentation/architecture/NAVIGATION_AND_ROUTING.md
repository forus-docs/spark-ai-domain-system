# Navigation and Routing Documentation

## Overview

NetBuild uses a hybrid routing approach combining dynamic domain-scoped routes with static global routes. The sidebar navigation intelligently builds URLs based on whether a route requires domain context.

## Routing Architecture

### Dynamic Domain Routes (`/[domain]/*`)

All routes that require domain context use Next.js dynamic routing with the `[domain]` segment. These routes:
- Extract the domain slug from the URL
- Validate user access via `DomainProvider`
- Fetch domain-specific data using the current domain context

**Implemented Domain Routes:**
| Route | Status | Description |
|-------|--------|-------------|
| `/[domain]` | ✅ Implemented | Domain home page showing task executions |
| `/[domain]/tasks` | ✅ Implemented | Domain task library and management |
| `/[domain]/invites` | ✅ Implemented | Invite management with role selection |
| `/[domain]/organogram` | 🔲 Stub | Organizational structure visualization |
| `/[domain]/teams` | 🔲 Stub | Team creation and management |
| `/[domain]/dashboards` | 🔲 Stub | Analytics and performance metrics |

### Static Global Routes

These routes exist outside domain context but are shown as stubs when accessed:
| Route | Description |
|-------|-------------|
| `/organogram` | Placeholder - redirects user to select a domain |
| `/teams` | Placeholder - redirects user to select a domain |
| `/dashboards` | Placeholder - redirects user to select a domain |

## Navigation Logic

The sidebar (`/app/components/sidebar.tsx`) uses the `buildHref` function to construct URLs:

```typescript
const buildHref = (item: NavItem) => {
  if (currentDomain && item.requiresDomain && currentDomain.slug) {
    // Prepends domain slug for domain-required routes
    return `/${currentDomain.slug}${item.href === '/' ? '' : item.href}`;
  }
  return item.href;
};
```

All navigation items have `requiresDomain: true`, meaning they will use domain-scoped URLs when a domain is selected.

## Route Behaviors

### With Domain Selected
- `/maven-hub/tasks` → Shows Maven Hub's tasks
- `/maven-hub/teams` → Shows Maven Hub's teams (stub)
- `/maven-hub/dashboards` → Shows Maven Hub's dashboards (stub)

### Without Domain Selected
- Navigation items are filtered out (not shown)
- User is redirected to `/domains` to select a domain

## Stub Page Descriptions

### Organogram (`/[domain]/organogram`)
**Purpose**: Visualize the organizational structure within a domain
- Display hierarchical reporting relationships
- Show role distributions across the organization
- Track department and team structures
- Enable org chart editing for admins

### Teams (`/[domain]/teams`)
**Purpose**: Create and manage functional teams within a domain
- Create new teams with specific purposes
- Assign team leaders and members
- Set team goals and KPIs
- Create team-specific workstreams
- Track team performance metrics

### Dashboards (`/[domain]/dashboards`)
**Purpose**: Provide analytics and insights for domain operations
- Task completion metrics by user, team, and category
- Member engagement analytics
- Domain growth trends
- Performance KPIs visualization
- Custom report generation
- Export capabilities for stakeholders

## Implementation Status

✅ **Fully Implemented**
- Dynamic routing infrastructure
- Domain validation and access control
- Tasks, Invites, and Home pages

🔲 **Stub Implementation**
- Organogram, Teams, and Dashboards show descriptive empty states
- Ready for future development with clear purpose definitions

## Security Considerations

All domain routes are protected by:
1. JWT authentication (middleware level)
2. Domain membership verification (`DomainProvider`)
3. Role-based access control (where applicable)

Users without access are redirected to `/domains` without information leakage.