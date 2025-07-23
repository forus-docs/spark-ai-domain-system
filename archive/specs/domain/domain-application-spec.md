# Domain Application Data Collection Specification

## Overview

This specification defines the data collection requirements and conversational flow for users applying to create a new domain in the Spark AI ecosystem. The AI Assistant guides applicants through a structured workstream to gather all necessary information for domain approval and deployment.

## Application Phases

```
┌─────────────────────────────────────────┐
│      Domain Application Workflow        │
├─────────────────────────────────────────┤
│ Phase 1: Basic Information              │
│ Phase 2: Business Model                 │
│ Phase 3: Role Design                    │
│ Phase 4: Technical Requirements         │
│ Phase 5: Compliance & Verification      │
│ Phase 6: Review & Submission            │
└─────────────────────────────────────────┘
```

## Phase 1: Basic Information

### 1.1 Domain Identity

```typescript
// Phase 2: Extended Domain Info for Application Process
interface DomainApplicationInfo {
  // Phase 1 fields (maps to Domain)
  id: string;                  // Unique identifier (was proposedId)
  name: string;                // Display name (2-50 characters)
  tagline: string;             // Brief description (10-100 characters)
  icon: string;                // Emoji or icon selection
  region: string;              // Geographic scope
  
  // Phase 2 extended fields for application
  category: DomainCategory;    // Industry category
  primaryLanguage: string;     // ISO 639-1 code
  applicantName: string;
  applicantEmail: string;
  applicantRole: string;       // Their role in the domain
  organizationName?: string;   // If applicable
}

enum DomainCategory {
  FINANCE = 'finance',
  TRANSPORT = 'transport',
  COMMERCE = 'commerce',
  INVESTMENT = 'investment',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  AGRICULTURE = 'agriculture',
  TECHNOLOGY = 'technology',
  OTHER = 'other'
}
```

### 1.2 Visual Identity

```typescript
// Phase 2: Visual Identity (maps to Domain color/gradient)
interface DomainVisualIdentity {
  icon: string;                // Emoji or icon selection
  color: string;               // Primary hex color (was primaryColor)
  gradient: string;            // CSS gradient classes (combines secondary color + direction)
  // Phase 2 extended:
  secondaryColor?: string;     // For gradient generation
  gradientDirection?: GradientType;
}

enum GradientType {
  LINEAR = 'linear',
  RADIAL = 'radial',
  DIAGONAL = 'diagonal'
}
```

### AI Assistant Prompts:

```
"Welcome! Let's create your new domain. First, what would you like to call your domain?"

"Great! Now, describe your domain in one compelling sentence (this will be your tagline)."

"Which category best describes your domain? [Show options]"

"Let's make it visually appealing. Choose an emoji that represents your domain."
```

## Phase 2: Business Model

### 2.1 Target Market

```typescript
interface TargetMarket {
  // Geographic Scope
  geographicScope: GeographicScope;
  specificRegions: string[];      // Countries/regions
  estimatedMarketSize: number;    // Potential users
  
  // Market Description
  problemStatement: string;        // What problem does this solve?
  existingSolutions: string[];     // Current alternatives
  uniqueValueProp: string;        // Why is this better?
}

enum GeographicScope {
  GLOBAL = 'global',
  CONTINENTAL = 'continental',  // e.g., Pan-African
  NATIONAL = 'national',
  REGIONAL = 'regional',        // e.g., Eastern Cape
  LOCAL = 'local'
}
```

### 2.2 Revenue Model

```typescript
interface RevenueModel {
  membershipFees: {
    identityVerification: string;     // Maps to joinDetails.minInvestment
    minimumInvestment?: string;       // Maps to joinDetails.minimumInvestment
  };
  
  revenueStreams: RevenueStream[];
  revenueSharingModel?: {
    platformShare: number;            // Percentage to Spark AI
    domainShare: number;              // Percentage to domain
    memberShare?: number;             // If revenue sharing with members
  };
  
  projectedMonthlyRevenue: {
    month3: number;
    month6: number;
    month12: number;
  };
}

interface RevenueStream {
  type: 'membership' | 'transaction' | 'subscription' | 'commission' | 'other';
  description: string;
  estimatedMonthlyValue: number;
}
```

### AI Assistant Prompts:

```
"What problem does your domain solve for users?"

"What geographic area will your domain serve? (Global, specific regions, etc.)"

"How will your domain generate revenue? Let's explore your business model."

"What's your projected user base in 3, 6, and 12 months?"
```

## Phase 3: Role Design

### 3.1 Role Structure

```typescript
interface RoleDesign {
  roles: ApplicationRoleDefinition[]; // Minimum 1, maximum 10 initially
  defaultRoleId: string;              // Which role is default
  roleRelationships?: RoleRelation[];
}

// Phase 2: Extended Role Definition for Application Process
interface ApplicationRoleDefinition {
  // Phase 1 fields (maps to DomainRole)
  id: string;                       // Unique identifier
  name: string;                     // Display name
  price: string;                    // e.g., "10 USD" (was monthlyFee)
  benefits: string[];               // 4-8 benefits (was coreBenefits)
  isDefault?: boolean;              // Default selection flag
  
  // Phase 2 extended fields for application
  description: string;              // Detailed explanation
  accessLevel: AccessLevel;
  eligibilityCriteria?: string[];   // Who can join this role
  verificationRequired?: VerificationType[];
  maxMembers?: number;              // Optional cap
  upgradePathTo?: string[];         // Role IDs they can upgrade to
}

enum AccessLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  IDENTITY = 'identity',
  BUSINESS = 'business',
  PROFESSIONAL = 'professional'
}

interface RoleRelation {
  roleId1: string;
  roleId2: string;
  relationship: 'requires' | 'excludes' | 'complements';
}
```

### 3.2 Role Interactions

```typescript
interface RoleInteractions {
  // How roles interact within the domain
  transactionFlows: TransactionFlow[];
  communicationMatrix: CommunicationRule[];
  collaborationFeatures: CollaborationFeature[];
}

interface TransactionFlow {
  fromRole: string;
  toRole: string;
  transactionType: string;
  description: string;
}
```

### AI Assistant Prompts:

```
"Let's design the roles for your domain. How many different types of users will you have?"

"For each role, I need: name, monthly fee, and 4-8 key benefits."

"Which role should be the default when users first join?"

"Do any roles have special requirements or verification needs?"

"How do these roles interact with each other? (e.g., buyers-sellers, advisors-investors)"
```

## Phase 4: Technical Requirements

### 4.1 Features & Integrations

```typescript
interface TechnicalRequirements {
  // Core Features
  requiredFeatures: CoreFeature[];
  customFeatures: CustomFeature[];
  
  // AI Agents
  aiAgents: AIAgentDefinition[];
  
  // Integrations
  externalIntegrations: Integration[];
  paymentMethods: PaymentMethod[];
  
  // Data Requirements
  dataStorage: DataRequirement[];
  complianceNeeds: ComplianceRequirement[];
}

interface AIAgentDefinition {
  name: string;
  purpose: string;
  availableToRoles: string[];      // Role IDs
  capabilities: string[];
}

interface Integration {
  type: 'api' | 'webhook' | 'blockchain' | 'payment' | 'other';
  service: string;
  purpose: string;
  required: boolean;
}

enum CoreFeature {
  WORKSTREAMS = 'workstreams',
  TASKS = 'tasks',
  TEAMS = 'teams',
  PROCEDURES = 'procedures',
  DASHBOARDS = 'dashboards',
  MESSAGING = 'messaging',
  PAYMENTS = 'payments',
  ANALYTICS = 'analytics'
}
```

### AI Assistant Prompts:

```
"Which core Spark AI features does your domain need? [Show checklist]"

"Would you like AI assistants in your domain? Describe their purposes."

"Do you need any external integrations? (Payment processors, APIs, etc.)"

"What kind of data will your domain handle? Any special compliance needs?"
```

## Phase 5: Compliance & Verification

### 5.1 Legal & Regulatory

```typescript
interface ComplianceInfo {
  // Business Registration
  businessEntity: {
    registered: boolean;
    entityType?: string;
    registrationNumber?: string;
    jurisdiction?: string;
  };
  
  // Regulatory Compliance
  regulatoryRequirements: {
    financialLicense?: boolean;
    dataProtection: boolean;
    industrySpecific: string[];
  };
  
  // Terms & Policies
  hasTermsOfService: boolean;
  hasPrivacyPolicy: boolean;
  disputeResolution: string;
}
```

### 5.2 Verification Documents

```typescript
interface VerificationDocuments {
  documents: Document[];
  additionalProofs: ProofOfConcept[];
}

interface Document {
  type: DocumentType;
  status: 'pending' | 'uploaded' | 'verified';
  url?: string;
}

enum DocumentType {
  BUSINESS_REGISTRATION = 'business_registration',
  TAX_ID = 'tax_id',
  BANK_ACCOUNT = 'bank_account',
  IDENTITY = 'identity',
  ADDRESS_PROOF = 'address_proof',
  LICENSES = 'licenses'
}

interface ProofOfConcept {
  type: 'prototype' | 'pilot' | 'whitepaper' | 'demo';
  description: string;
  url?: string;
}
```

### AI Assistant Prompts:

```
"Is your organization legally registered? If yes, provide details."

"Does your domain require any special licenses or regulatory compliance?"

"Please upload verification documents. [Show required list]"

"Do you have a prototype, pilot, or demo we can review?"
```

## Phase 6: Review & Submission

### 6.1 Application Summary

```typescript
// Phase 2: Complete Application (extends Phase 1 Domain)
interface DomainApplication {
  // Metadata
  applicationId: string;
  submittedAt: Date;
  status: ApplicationStatus;
  
  // Phase 1 Domain fields
  domain: Domain;              // Core domain structure
  
  // Phase 2 extended application data
  applicationInfo: DomainApplicationInfo;
  targetMarket: TargetMarket;
  revenueModel: RevenueModel;
  roleDesign: RoleDesign;
  roleInteractions: RoleInteractions;
  technicalRequirements: TechnicalRequirements;
  complianceInfo: ComplianceInfo;
  verificationDocuments: VerificationDocuments;
  teamMembers: TeamMember[];
  launchTimeline: Timeline;
  marketingPlan: string;
  supportPlan: string;
}

interface TeamMember {
  name: string;
  role: string;
  experience: string;
  linkedIn?: string;
}

interface Timeline {
  phases: {
    phase: string;
    startDate: Date;
    endDate: Date;
    milestones: string[];
  }[];
}

enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ADDITIONAL_INFO_REQUESTED = 'additional_info_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DEPLOYED = 'deployed'
}
```

### AI Assistant Prompts:

```
"Let's review your application. Here's what we have so far..."

"Who are the key team members who will manage this domain?"

"What's your launch timeline and key milestones?"

"How will you market this domain and onboard initial users?"

"Everything looks complete! Ready to submit for review?"
```

## Validation Rules

### Required Minimums
- At least 1 role defined
- Minimum 4 benefits per role
- Identity verification fee must be >= 10 USD
- At least 3 months of projected revenue data

### Character Limits
- Domain ID: 3-20 characters (lowercase, no spaces)
- Domain Name: 2-50 characters
- Tagline: 10-100 characters
- Role Names: 2-30 characters
- Benefits: 10-150 characters each

### Business Logic
- Sum of revenue sharing must equal 100%
- Default role must exist in roles array
- Role IDs must be unique within domain
- Gradient requires two different colors

## AI Assistant Behavior

### Progressive Disclosure
- Start with essential information
- Add complexity based on domain type
- Skip irrelevant sections based on answers

### Validation Feedback
```typescript
interface ValidationFeedback {
  field: string;
  issue: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}
```

### Save & Resume
- Auto-save after each phase
- Allow user to resume application
- Show progress indicator
- Estimate time remaining

## Post-Submission Process

### Review Timeline
- Initial review: 2-3 business days
- Additional info requests: 24 hours to respond
- Final decision: 5-7 business days

### Approval Criteria
1. Complete and accurate information
2. Viable business model
3. Technical feasibility
4. Compliance verification
5. Unique value proposition

### Next Steps After Approval
1. Convert ApplicationRoleDefinition[] to DomainRole[]
2. Create Domain object with core fields
3. Smart contract deployment
4. Domain configuration
5. Initial user onboarding
6. Marketing material approval
7. Go-live checklist

## Phase 1 to Phase 2 Mapping

The application process collects extended data that maps to the simplified Phase 1 schema:

- `ApplicationRoleDefinition` → `DomainRole` (core fields)
- `DomainApplicationInfo` → `Domain` (core fields)
- `RevenueModel.membershipFees` → `Domain.joinDetails`
- Extended fields stored separately for Phase 2 features

---

*Domain Application Specification Version: 1.0*  
*Spark AI Platform by FORUS Digital*