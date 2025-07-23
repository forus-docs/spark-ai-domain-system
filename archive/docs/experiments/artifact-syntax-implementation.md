# Artifact Syntax Implementation

## Overview

This document describes the implementation of explicit artifact syntax in the Spark AI Domain System, making the AI assistant artifact-aware and able to render interactive forms and other artifacts.

## How It Works

### 1. AI Response with Artifact Syntax

When the AI extracts data from a document, it now responds using the artifact syntax:

```markdown
I've extracted the following information from your ID document:

**Personal Details:**
- Full Name: John Smith
- ID Number: 123456789

```artifact:form
{
  "title": "Verify Extracted Information",
  "description": "Please review and confirm the information extracted from your document",
  "fields": {
    "firstName": "John",
    "lastName": "Smith",
    "idNumber": "123456789",
    "dateOfBirth": "1990-01-15"
  },
  "validation": {
    "allRequiredFieldsFound": false,
    "missingFields": ["documentExpiry"]
  },
  "actions": ["submit", "cancel"],
  "submitText": "Confirm Information",
  "cancelText": "Re-upload Document"
}
```
```

### 2. Artifact Detection

The `SmartMessageDisplay` component detects artifact blocks:
- Looks for pattern: ` ```artifact:type`
- Parses the JSON content
- Extracts artifact type and metadata
- Falls back to regular JSON if no artifact syntax

### 3. Artifact Rendering

The `ArtifactDisplay` component renders different artifact types:
- **form**: Interactive form with editable fields
- **react**: React component preview (future)
- **html**: HTML rendering (future)
- **mermaid**: Diagram rendering (future)
- **data**: Structured data display (future)

### 4. Form Artifacts Features

Form artifacts include:
- Title and description
- Editable input fields
- Validation status display
- Custom submit/cancel button text
- Field validation indicators
- Placeholder text for null values

## Implementation Details

### Updated Files

1. **`app/lib/ai-prompts.ts`**
   - Updated system prompts to use artifact syntax
   - Added artifact examples in prompt templates
   - Modified extraction instructions

2. **`app/components/smart-message-display.tsx`**
   - Added artifact detection regex
   - Enhanced parsing to handle artifact metadata
   - Passes artifact type and data to display

3. **`app/components/artifact-display.tsx`**
   - Handles multiple artifact types
   - Renders form artifacts with full metadata
   - Supports custom actions and text

## Benefits

1. **Explicit Intent**: AI clearly indicates when creating an artifact
2. **Rich Metadata**: Artifacts include titles, descriptions, and configuration
3. **Future-Ready**: Supports multiple artifact types beyond forms
4. **Better UX**: Users see purpose-built UI instead of raw JSON
5. **Extensible**: Easy to add new artifact types

## Example Usage

### Identity Verification
```artifact:form
{
  "title": "Identity Document Review",
  "description": "Confirm your personal information",
  "fields": { ... },
  "validation": { ... }
}
```

### Savings Calculator
```artifact:data
{
  "title": "Savings Projection",
  "type": "calculation",
  "results": { ... }
}
```

### Process Diagram
```artifact:mermaid
{
  "title": "Approval Workflow",
  "diagram": "graph TD; A-->B; B-->C;"
}
```

## Next Steps

1. Implement additional artifact types
2. Add artifact history/versioning
3. Enable artifact export functionality
4. Create artifact templates library
5. Add collaborative editing features