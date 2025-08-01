# Standard Operating Procedure (SOP) Structure Documentation

## Overview

This document describes the SOP structure implementation in the Spark AI Domain System. SOPs are now fully integrated into the Process model and sent to the AI for context-aware assistance.

## SOP Structure

Each SOP contains the following sections:

### 1. Objective
- Clear statement of what the SOP aims to achieve
- Should be specific and measurable

### 2. Scope
```typescript
scope: {
  included: string[];      // What is covered by this SOP
  excluded: string[];      // What is explicitly not covered
  applicableTo: string[];  // Who/what this applies to
}
```

### 3. Policies (Compliance)
```typescript
policies: {
  compliance: string[];    // Regulatory compliance requirements
  standards: string[];     // Industry standards to follow
  regulations: string[];   // Specific regulations that apply
}
```

### 4. Roles and Responsibilities
```typescript
rolesAndResponsibilities: Array<{
  role: string;
  responsibilities: string[];
  requiredSkills?: string[];
}>
```

### 5. Procedures (Steps)
```typescript
procedures: Array<{
  stepNumber: number;
  name: string;
  description: string;
  responsible: string;     // Role responsible for this step
  inputs?: string[];       // What's needed to start
  outputs?: string[];      // What's produced
  tools?: string[];        // Tools/systems required
  duration?: string;       // Estimated time
  decisionPoints?: Array<{
    condition: string;
    truePath: string;      // What to do if condition is true
    falsePath: string;     // What to do if condition is false
  }>;
}>
```

### 6. Metadata
```typescript
metadata: {
  version: string;
  effectiveDate: Date;
  reviewDate: Date;
  owner: string;
  approvedBy: string;
  changeHistory?: Array<{
    version: string;
    date: Date;
    changes: string;
    changedBy: string;
  }>;
}
```

## AI Integration

When a user interacts with an SOP process, the AI receives:

1. **Complete SOP Structure** - All sections described above
2. **Current Context** - User's position in the process
3. **Compliance Requirements** - To ensure adherence
4. **Step-by-Step Guidance** - AI guides through procedures

### Example AI System Prompt with SOP:

```
STANDARD OPERATING PROCEDURE:

OBJECTIVE: Ensure all vehicles meet safety standards...

SCOPE:
- Included: All fleet vehicles, Driver safety equipment
- Excluded: Personal vehicles
- Applicable To: Fleet operators, Vehicle owners

COMPLIANCE & POLICIES:
- Compliance Requirements: DOT regulations, OSHA standards
- Standards: ISO 39001 Road Traffic Safety
- Regulations: Vehicle roadworthiness certificates

ROLES & RESPONSIBILITIES:
- Fleet Manager: Oversee compliance program; Review reports
- Safety Inspector: Conduct inspections; Document findings
- Vehicle Operator: Pre-trip inspections; Report issues

PROCEDURE STEPS:
1. Pre-Inspection Preparation
   Description: Gather all required documentation
   Responsible: Vehicle Operator
   Inputs: Vehicle registration, Insurance documents
   Duration: 15 minutes

[... more steps ...]

You must follow this SOP when assisting the user. Guide them through each step in order, ensuring compliance with all policies and procedures.
```

## Benefits

1. **Structured Guidance** - AI knows exact steps and order
2. **Compliance Assurance** - All policies are followed
3. **Role Clarity** - AI knows who does what
4. **Decision Support** - AI handles conditional logic
5. **Audit Trail** - All steps are documented

## Migration

Existing SOP processes can be migrated using:
```bash
npm run migrate:sop
```

This will:
1. Find all processes with `executionModel: 'sop'`
2. Add the `standardOperatingProcedure` structure
3. Apply templates where available
4. Create basic structure for others

## Future Enhancements

1. **Dynamic SOPs** - AI can suggest improvements
2. **Version Control** - Track SOP changes over time
3. **Compliance Tracking** - Monitor adherence
4. **Performance Metrics** - Measure SOP effectiveness
5. **AI Optimization** - Learn from execution patterns