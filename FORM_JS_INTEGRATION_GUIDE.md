# Form-js Integration Guide

## Overview

We've successfully integrated form-js with a conversational UI approach for the Spark AI platform. This allows forms to be completed through a natural chat interface while leveraging form-js's robust schema and validation.

## Architecture

### 1. **Form Schema Storage**
- Form schemas are stored in `MasterTask.formSchema` using form-js JSON format
- The schema defines all fields, types, labels, and validation rules

### 2. **Conversational Form Renderer**
- `ConversationalFormRenderer` service converts form-js schemas into conversational flows
- Handles field-by-field collection with validation
- Supports AI-extracted data for pre-filling fields

### 3. **Chat Integration**
- Form messages are rendered inline in the chat interface
- Support for quick actions (confirm/edit) on extracted data
- Final review shows complete form using form-js viewer

## Testing the Identity Verification Flow

### Prerequisites
1. User must be logged in
2. Navigate to a domain (e.g., Maven Hub)
3. Find "Capture ID Document" task

### Flow Steps

1. **Start Task**
   - Click on "Capture ID Document" task
   - System shows intro message
   - Form renderer initializes with form-js schema

2. **Document Upload**
   - User uploads ID document (image or PDF)
   - System shows "Processing your document... 🔄"

3. **AI Extraction**
   - Mock AI extracts data from document
   - Extracted fields: firstName, lastName, idNumber, dateOfBirth, nationality, gender, documentType

4. **Conversational Verification**
   - For each field with extracted data:
     - AI: "I found your First Name: 'John'. Is this correct?"
     - User can click "Yes" or "No, let me correct it"
   - For missing fields:
     - AI: "Please provide your [Field Name]"
     - User types response

5. **Validation**
   - Each field is validated using form-js rules
   - Invalid inputs show error messages
   - User must correct before proceeding

6. **Final Review**
   - All fields shown in a complete form
   - User can "Confirm & Submit" or "Edit"
   - form-js handles final validation

7. **Completion**
   - Form data is submitted
   - User status updated (for identity verification)
   - Redirect to domain home

## Key Components

### 1. **ConversationalFormRenderer** (`/app/lib/services/conversational-form.service.ts`)
```typescript
- setExtractedData(data) // Set AI-extracted values
- startConversation() // Begin field collection
- processFieldResponse(fieldKey, value) // Handle user input
- validateField(component, value) // Use form-js validation
- generateReviewMessage() // Create final form review
```

### 2. **FormMessage** (`/app/components/form-message.tsx`)
```typescript
- type: 'form-field' // Single field interaction
- type: 'form-review' // Complete form review
- Renders form-js components for final review
- Handles quick actions for extracted data
```

### 3. **Chat Interface Updates** (`/app/components/chat-interface-v2.tsx`)
```typescript
- handleDocumentExtraction() // Process uploaded documents
- handleFormFieldSubmit() // Process field responses
- handleFormSubmit() // Handle final form submission
- Supports form message types in rendering
```

## Form Schema Example

```javascript
{
  type: "default",
  id: "IDVerificationForm",
  components: [
    {
      type: "textfield",
      id: "firstName",
      key: "firstName",
      label: "First Name",
      validate: {
        required: true,
        minLength: 1,
        maxLength: 100
      }
    },
    // ... more fields
  ]
}
```

## Benefits

1. **Natural UX**: Users interact through conversation, not traditional forms
2. **AI Assistance**: Reduces manual input through document extraction
3. **Progressive Disclosure**: One field at a time reduces cognitive load
4. **Robust Validation**: Leverages form-js validation rules
5. **Standards Compliant**: Uses Camunda/BPMN form standards
6. **Flexible**: Can render traditional forms when needed

## Future Enhancements

1. **Real OCR Integration**: Replace mock extraction with actual OCR service
2. **Dynamic Field Dependencies**: Show/hide fields based on previous answers
3. **Multi-language Support**: Leverage form-js i18n capabilities
4. **Custom Components**: Add domain-specific form components
5. **Form Templates**: Pre-built schemas for common tasks

## Development Notes

- Form schemas are defined in form-js JSON format
- Validation happens at each step AND at final submission
- The conversational renderer is execution-model agnostic
- Can be used for any `executionModel: 'form'` task