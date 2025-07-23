# Spark AI Domain System: Multi-Role Architecture Specification

## Executive Summary

The Spark AI Domain System implements a **unified multi-role architecture** that enables industry-specific business ecosystems. Each domain supports multiple user roles with differentiated access, pricing, and benefits, creating multi-sided marketplaces where stakeholders collaborate through AI-powered workflows and Web3 payments.

This specification defines the core schema, implementation patterns, and extensibility model for the domain system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Schema Definition](#core-schema-definition)
3. [Technical Implementation](#technical-implementation)
4. [User Experience Patterns](#user-experience-patterns)
5. [Extensibility Model](#extensibility-model)
6. [API Reference](#api-reference)

---

## Architecture Overview

### Domain System Principles

1. **Universal Role Support**: Every domain must support at least one role, with unlimited role expansion capability
2. **Consistent Data Schema**: All domains follow identical structure for predictable behavior
3. **Role-Based Access**: Each role defines its own pricing, benefits, and feature access
4. **Smart Contract Integration**: Blockchain-based membership and payment processing
5. **Cross-Domain Compatibility**: Users can hold multiple roles across different domains

### Core Components

```
┌─────────────────────────────────────────┐
│         Domain Architecture             │
├─────────────────────────────────────────┤
│  Domain Definition                      │
│  ├── Basic Properties (id, name, etc)   │
│  ├── Role Definitions (1 to n roles)    │
│  ├── AI Agents (optional)               │
│  └── Payment Configuration              │
├─────────────────────────────────────────┤
│  Role Management                        │
│  ├── Role Selection UI                  │
│  ├── Membership Tracking                │
│  └── Access Control                     │
├─────────────────────────────────────────┤
│  User State                             │
│  ├── Joined Domains                     │
│  ├── Active Roles                      │
│  └── Current Context                    │
└─────────────────────────────────────────┘
```

---

## Core Schema Definition

### TypeScript Interfaces

```typescript
interface DomainRole {
  id: string;           // Unique identifier within domain
  name: string;         // Display name
  price: string;        // Joining fee (e.g., "10 USD")
  isDefault?: boolean;  // Optional default selection flag
  benefits: string[];   // Array of role-specific benefits
  // Phase 2 extensions:
  // description?: string;
  // requirements?: RoleRequirements;
  // accessLevel?: AccessLevel;
}

interface JoinDetails {
  minInvestment: string;      // Identity verification cost
  minimumInvestment?: string; // Domain-specific requirements
  benefit: string;            // Primary value proposition
}

interface Domain {
  id: string;                  // Unique domain identifier
  icon: string;                // Visual representation (emoji)
  name: string;                // Display name
  tagline: string;             // Brief description
  cta: string;                 // Call to action text
  region: string;              // Geographic scope
  color: string;               // Primary brand color (hex)
  gradient: string;            // CSS gradient classes
  hasExistingMembers: boolean; // Shows membership options
  joinDetails: JoinDetails;    // Joining requirements
  roles: DomainRole[];         // Required: minimum 1 role
  agents?: string[];           // Optional AI agents
  // Phase 2 extensions:
  // category?: DomainCategory;
  // primaryLanguage?: string;
  // createdBy?: string;
  // createdAt?: Date;
}

interface UserDomainMembership {
  domainId: string;    // Domain identifier
  roleId: string;      // Selected role id
  // Phase 2 extensions:
  // joinedAt?: Date;
  // lastAccessed?: Date;
  // membershipStatus?: 'active' | 'suspended' | 'expired';
}
```

### Schema Constraints

1. **Roles Array**: Must contain at least one role object
2. **Role IDs**: Must be unique within a domain
3. **Default Role**: Maximum one role can have `isDefault: true`
4. **Price Format**: String format for multi-currency support
5. **Benefits**: Non-empty array of benefit descriptions

---

## Technical Implementation

### Core Helper Functions

```javascript
// Check if user has joined a specific domain
const isJoined = (domainId) => userMemberships.some(m => m.domainId === domainId);

// Get the role user selected when joining a domain
const getJoinedRole = (domainId) => {
  const membership = userMemberships.find(m => m.domainId === domainId);
  return membership?.roleId;
};

// Get role information for any domain
const getRoleInfo = (domainId, roleId) => {
  const domain = domains.find(d => d.id === domainId);
  return domain?.roles?.find(r => r.id === roleId);
};

// Get display name for a role
const getRoleDisplayName = (domainId, roleId) => {
  const role = getRoleInfo(domainId, roleId);
  return role?.name || 'Member';
};

// Get default role for a domain
const getDefaultRole = (domain) => {
  return domain.roles?.find(r => r.isDefault) || domain.roles?.[0];
};

// Check if domain has multiple roles
const hasMultipleRoles = (domain) => {
  return domain.roles && domain.roles.length > 1;
};

// Initialize selected role when selecting a domain
const initializeSelectedRole = (domain) => {
  if (isJoined(domain.id)) {
    setSelectedRole(getJoinedRole(domain.id));
  } else {
    const defaultRole = getDefaultRole(domain);
    setSelectedRole(defaultRole?.id || null);
  }
};
```

### State Management

```javascript
// Core state variables
const [selectedDomain, setSelectedDomain] = useState(null);     // Domain being viewed
const [userMemberships, setUserMemberships] = useState([]);     // Array of UserDomainMembership
const [currentDomain, setCurrentDomain] = useState(null);       // Active domain context
const [selectedRole, setSelectedRole] = useState(null);         // Role selection state
const [identityVerified, setIdentityVerified] = useState(false); // KYC status

// Join domain handler
const handleJoin = (domainId) => {
  const domain = domains.find(d => d.id === domainId);
  const roleToJoin = selectedRole || getDefaultRole(domain)?.id;
  
  setUserMemberships([
    ...userMemberships.filter(m => m.domainId !== domainId), 
    { domainId: domainId, roleId: roleToJoin }
  ]);
  
  // Reset state
  setSelectedDomain(null);
  setSelectedRole(null);
  setIdentityVerified(false);
};
```

### Role Selection UI Pattern

```jsx
// Universal role selection component
{hasMultipleRoles(selectedDomain) && (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">
      {isJoined(selectedDomain.id) ? 'Your role:' : 'Select your role:'}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {selectedDomain.roles.map((role) => (
        <RoleCard 
          key={role.id} 
          role={role} 
          domain={selectedDomain}
          selected={selectedRole === role.id}
          disabled={isJoined(selectedDomain.id)}
          onSelect={(roleId) => setSelectedRole(roleId)}
        />
      ))}
    </div>
  </div>
)}
```

---

## User Experience Patterns

### Domain Switching

Users access domains through a dropdown selector that shows:
- Current active domain (if selected)
- List of joined domains with roles
- Option to browse all domains

```jsx
<DomainDropdown>
  <CurrentDomain>{currentDomain?.name || 'Join a Domain'}</CurrentDomain>
  <DropdownMenu>
    <BrowseOption onClick={() => setActiveSection('domains')}>
      Browse all domains
    </BrowseOption>
    {joinedDomains.map(domain => (
      <DomainOption 
        key={domain.id}
        active={currentDomain === domain.id}
        onClick={() => setCurrentDomain(domain.id)}
      >
        {domain.name} • {getRoleDisplayName(domain.id, domain.role)}
      </DomainOption>
    ))}
  </DropdownMenu>
</DomainDropdown>
```

### Content Filtering

When a domain is selected, all navigation items filter to show domain-specific content:

```javascript
const isDomainSpecific = (item) => item.domainSpecific;
const shouldShowItem = (item) => !isDomainSpecific(item) || currentDomain;
```

### Join Flow

1. **Identity Verification** (all domains)
2. **Membership Status** (for domains with existing members)
3. **Role Selection** (for multi-role domains)
4. **Payment Processing** (via FORUS Wallet)
5. **Access Granted** (NFT minted)

---

## Extensibility Model

### Adding New Roles

Roles can be added to any domain without code changes to the core system. The domain definition supports dynamic role addition through the standard role interface.

### Future Schema Extensions

#### Dynamic Pricing
```javascript
price: {
  monthly: '50 USD',
  annual: '500 USD',
  lifetime: '2000 USD'
}
```

#### Role Requirements
```javascript
requirements: {
  previousRole: 'merchant',
  verificationLevel: 2,
  minimumActivity: 100
}
```

#### Cross-Domain Roles
```javascript
scope: {
  domains: ['domain1', 'domain2'],
  permissions: ['read', 'write']
}
```

#### Role Hierarchies
```javascript
inherits: ['base_member', 'moderator'],
additionalBenefits: ['Admin dashboard']
```

---

## API Reference

### Domain Registration

```javascript
POST /api/domains/register
{
  domain: Domain,
  creatorAddress: string,
  signature: string
}
```

### Join Domain

```javascript
POST /api/users/:userId/domains/:domainId/join
{
  roleId: string,
  paymentProof?: string  // Optional payment transaction hash
}
Response: {
  success: boolean,
  membership: UserDomainMembership
}
```

### Get User Domains

```javascript
GET /api/users/:userId/memberships
Response: {
  memberships: UserDomainMembership[]
}
```

### Update Role

```javascript
PUT /api/users/:userId/domains/:domainId/role
{
  newRoleId: string
}
Response: {
  success: boolean,
  membership: UserDomainMembership
}
```

### Domain Analytics

```javascript
GET /api/domains/:domainId/analytics
Response: {
  totalMembers: number,
  roleDistribution: { [roleId]: number },
  revenue: { total: string, byRole: { [roleId]: string } }
}
```

---

## Smart Contract Integration

### Domain Membership Contract

```solidity
contract DomainMembership {
    struct Member {
        uint256 domainId;
        uint256 roleId;
        uint256 joinedAt;
        bool active;
    }
    
    mapping(address => Member[]) public memberships;
    mapping(uint256 => mapping(uint256 => uint256)) public roleFees;
    
    function joinDomain(uint256 domainId, uint256 roleId) external payable {
        require(msg.value >= roleFees[domainId][roleId], "Insufficient payment");
        
        memberships[msg.sender].push(Member({
            domainId: domainId,
            roleId: roleId,
            joinedAt: block.timestamp,
            active: true
        }));
        
        emit DomainJoined(msg.sender, domainId, roleId);
    }
    
    function hasRole(address user, uint256 domainId, uint256 roleId) 
        external view returns (bool) {
        Member[] memory userMemberships = memberships[user];
        for (uint i = 0; i < userMemberships.length; i++) {
            if (userMemberships[i].domainId == domainId && 
                userMemberships[i].roleId == roleId && 
                userMemberships[i].active) {
                return true;
            }
        }
        return false;
    }
}
```

---

*Specification Version: 1.0*  
*Platform: Spark AI by FORUS Digital*