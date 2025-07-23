# Navigation System Specification

## Overview

The Spark AI Domain System implements a domain-aware navigation system that adapts based on the user's selected domain and joined memberships. This document bridges the gap between the core domain specification and the UI implementation's navigation features.

## Architecture

### Core Components

```
┌─────────────────────────────────────────┐
│         Navigation System               │
├─────────────────────────────────────────┤
│  Domain Selector Dropdown               │
│  ├── Current Domain Display             │
│  ├── Joined Domains List                │
│  └── Browse All Domains Option          │
├─────────────────────────────────────────┤
│  Sidebar Navigation                     │
│  ├── Global Items (always visible)      │
│  ├── Domain-Specific Items              │
│  └── Recent Activity Section            │
├─────────────────────────────────────────┤
│  Content Area                           │
│  ├── Domain-Filtered Content            │
│  └── Section-Specific Views             │
└─────────────────────────────────────────┘
```

## State Management

### Navigation State Variables

```javascript
// UI-specific state
const [activeSection, setActiveSection] = useState('domains');      // Current view
const [sidebarOpen, setSidebarOpen] = useState(true);              // Sidebar visibility
const [domainDropdownOpen, setDomainDropdownOpen] = useState(false); // Dropdown state

// Core domain state (aligned with unified schema)
const [currentDomain, setCurrentDomain] = useState(null);          // Active domain context
const [userMemberships, setUserMemberships] = useState([]);        // Array of UserDomainMembership
```

### State Relationships

```
activeSection determines → Content displayed in main area
currentDomain filters → Available navigation items
sidebarOpen controls → Navigation visibility
domainDropdownOpen manages → Domain selector UI
```

## Navigation Items Configuration

### Item Structure

```javascript
const sidebarItems = [
  { 
    id: 'newworkstream',      // Unique identifier
    label: 'New workstream',  // Display text
    icon: '➕',              // Visual indicator
    domainSpecific: false    // Always visible
  },
  { 
    id: 'workstreams', 
    label: 'Workstreams', 
    icon: '🔄', 
    domainSpecific: true     // Only visible when domain selected
  },
  // ... additional items
];
```

### Domain-Specific Filtering

Items with `domainSpecific: true` are only displayed when a domain is selected:

```javascript
// Visibility logic
if (item.domainSpecific && !currentDomain) {
  return null; // Hide item
}
```

## Domain Selector Dropdown

### Functionality

1. **No Domain Selected**: Shows "Join a Domain" prompt
2. **Domain Active**: Displays domain name, role, and region
3. **Dropdown Open**: Lists all joined domains plus browse option

### Visual States

```javascript
// Current domain display format
{currentDomain ? (
  <div>
    <p>{getCurrentDomainInfo()?.name}</p>
    <p>{getRoleDisplayName(currentDomain, getJoinedRole(currentDomain))} • {getCurrentDomainInfo()?.region}</p>
  </div>
) : (
  <span>Join a Domain</span>
)}
```

### User Actions

| Action | Result |
|--------|--------|
| Click "Browse all domains" | Sets `activeSection` to 'domains', clears `currentDomain` |
| Select joined domain | Sets `currentDomain`, changes `activeSection` to 'workstreams' |
| Click outside dropdown | Closes dropdown via event propagation |

## Recent Items System

### Purpose
Provides quick access to recently accessed content within the current domain context.

### Implementation

```javascript
const getDomainRecentItems = (domainId) => {
  const recentItemsMap = {
    maven: [
      { 
        icon: '📊', 
        title: 'Investment Analytics',
        description: 'Q1 portfolio performance review...',
        timestamp: '2 hours ago',
        section: 'dashboards' // Links to navigation section
      },
      // ... more items
    ],
    wow: [ /* Transport-specific items */ ],
    bemnet: [ /* Finance-specific items */ ],
    pacci: [ /* Commerce-specific items */ ]
  };
  
  return recentItemsMap[domainId] || defaultItems;
};
```

### Recent Item Actions
Clicking a recent item:
1. Sets `activeSection` to the item's section
2. Maintains current domain context
3. Loads section-specific content

## Content Area Behavior

### Section Loading Logic

```javascript
// Domain-aware content display
{activeSection === 'domains' && <DomainBrowser />}
{activeSection === 'workstreams' && currentDomain && <Workstreams />}
{activeSection === 'tasks' && currentDomain && <Tasks />}
// ... other sections
```

### Empty States

When domain-specific content is accessed without a domain:
```
"Select a domain to view {sectionName}"
```

## Navigation Flow Examples

### New User Flow
```
1. Land on 'domains' section
2. Browse and select domain
3. Join domain with role
4. Auto-switch to domain context
5. Access domain-specific features
```

### Returning User Flow
```
1. Dropdown shows joined domains
2. Select domain from dropdown
3. Navigate to 'workstreams'
4. View domain-filtered content
5. Switch domains via dropdown
```

### Multi-Domain User Flow
```
1. Join multiple domains
2. Use dropdown to switch context
3. Each domain maintains separate:
   - Recent items
   - Active section memory
   - Role-based access
```

## Responsive Behavior

### Sidebar Toggle
- Hamburger menu toggles sidebar visibility
- Content area expands when sidebar hidden
- Breadcrumb shows current section when collapsed

### Mobile Considerations
```javascript
// Sidebar width management
className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300`}
```

## Integration Points

### With Domain System
- `currentDomain` links to domain definitions
- `userMemberships` tracks user's domain memberships
- `getJoinedRole()` determines feature access
- `getRoleDisplayName()` for UI display

### With Authentication
- User profile displayed at sidebar bottom
- Subscription tier shown ("Max plan")
- Future: Role-based navigation filtering

### With Content Modules
- Each section registers with navigation
- Sections check `currentDomain` for context
- Content filtered by domain + role

## Extension Guidelines

### Adding New Navigation Items

```javascript
// Add to sidebarItems array
{
  id: 'analytics',
  label: 'Analytics',
  icon: '📈',
  domainSpecific: true,
  roleRequired: ['advisor', 'investor'] // Future enhancement
}
```

### Adding Domain-Specific Sections

1. Add item to `sidebarItems`
2. Implement content component
3. Add case to content switch
4. Define recent items format

### Custom Navigation Per Domain

```javascript
// Phase 2: Dynamic navigation per domain
const getDomainNavItems = (domainId) => {
  return domainNavigationMap[domainId] || defaultItems;
};
```

## State Persistence

### Current Implementation
- All navigation state is session-based
- No localStorage usage
- Domain membership persists via blockchain

### Future Enhancements
```javascript
// Phase 1: Session persistence
const persistedNavState = {
  currentDomain: currentDomain,
  activeSection: activeSection,
  sidebarOpen: sidebarOpen,
  userMemberships: userMemberships
};
```

## Performance Considerations

1. **Lazy Loading**: Section content loads on demand
2. **Memoization**: Recent items cached per domain
3. **Event Delegation**: Single click handler for dropdown
4. **CSS Transitions**: Hardware-accelerated animations

## Accessibility

- Keyboard navigation support needed
- ARIA labels for screen readers required
- Focus management for dropdown
- Semantic HTML structure maintained

---

*Navigation System Version: 1.0*  
*Last Updated: Current Implementation*