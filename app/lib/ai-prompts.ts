/**
 * AI Prompt Engineering for Structured Data Extraction
 * 
 * This module provides prompt templates and examples for getting
 * AI assistants to return both human-readable content and 
 * machine-readable structured data.
 */

import { AI_ERROR_HANDLING_PROMPT } from './error-codes';

export interface ProcessContext {
  processId: string;
  processName: string;
  executionModel: string;
  currentStage?: string;
  domainId?: string;
  requiredParameters?: Array<{
    name: string;
    displayName: string;
    type: string;
    description?: string;
    validation?: any;
    examples?: string[];
  }>;
  standardOperatingProcedure?: any;
}

/**
 * Generate a system prompt that instructs the AI to return structured data
 */
export function generateSystemPrompt(context: ProcessContext): string {
  let requiredFieldsSection = '';
  let sopSection = '';
  
  // Add SOP context for SOP execution model
  if (context.executionModel === 'sop' && context.standardOperatingProcedure) {
    const sop = context.standardOperatingProcedure;
    sopSection = `\n\nSTANDARD OPERATING PROCEDURE:

OBJECTIVE: ${sop.objective}

SCOPE:
- Included: ${sop.scope?.included?.join(', ') || 'N/A'}
- Excluded: ${sop.scope?.excluded?.join(', ') || 'N/A'}
- Applicable To: ${sop.scope?.applicableTo?.join(', ') || 'N/A'}

COMPLIANCE & POLICIES:
- Compliance Requirements: ${sop.policies?.compliance?.join(', ') || 'N/A'}
- Standards: ${sop.policies?.standards?.join(', ') || 'N/A'}
- Regulations: ${sop.policies?.regulations?.join(', ') || 'N/A'}

ROLES & RESPONSIBILITIES:
${sop.rolesAndResponsibilities?.map((r: any) => 
  `- ${r.role}: ${r.responsibilities?.join('; ') || 'N/A'}`
).join('\n') || 'N/A'}

PROCEDURE STEPS:
${sop.procedures?.map((p: any) => 
  `${p.stepNumber}. ${p.name}
   Description: ${p.description}
   Responsible: ${p.responsible}
   ${p.inputs?.length > 0 ? `Inputs: ${p.inputs.join(', ')}` : ''}
   ${p.outputs?.length > 0 ? `Outputs: ${p.outputs.join(', ')}` : ''}
   ${p.duration ? `Duration: ${p.duration}` : ''}`
).join('\n\n') || 'N/A'}

You must follow this SOP when assisting the user. Guide them through each step in order, ensuring compliance with all policies and procedures.`;
  }
  
  if (context.requiredParameters && context.requiredParameters.length > 0) {
    requiredFieldsSection = `\n\nREQUIRED PARAMETERS FOR THIS PROCESS:
${context.requiredParameters.map(param => {
  let paramInfo = `- ${param.displayName} (${param.name}): ${param.type}`;
  if (param.description) {
    paramInfo += `\n  Description: ${param.description}`;
  }
  if (param.examples && param.examples.length > 0) {
    paramInfo += `\n  Examples: ${param.examples.join(', ')}`;
  }
  if (param.validation?.required) {
    paramInfo += `\n  Required: Yes`;
  }
  return paramInfo;
}).join('\n')}

IMPORTANT RULES:
1. ONLY extract the fields listed above - do NOT extract any other fields
2. The JSON "fields" object must ONLY contain the parameter names listed above
3. Map document fields intelligently to these exact parameter names:
   - "Surname" or "Family Name" → "lastName"
   - "Given Names" or "Forenames" → "firstName"
   - "Identity Number" or "Document No." → "idNumber"
   - Different date formats → normalize to YYYY-MM-DD
4. If a required field is not found in the document, set its value to null
5. Do NOT include any fields that are not in the required parameters list`;
  }
  
  return `You are an AI assistant helping with the "${context.processName}" process.

IMPORTANT: When extracting or validating data fields, you must provide the data in TWO formats:

1. Human-readable explanation in markdown
2. Machine-readable artifact using the artifact syntax (artifact:form for forms, artifact:data for other structured data)

${sopSection}
${requiredFieldsSection}

${AI_ERROR_HANDLING_PROMPT}

Example response format:
---
I've extracted the following information from your document:

**Personal Details:**
- Full Name: John Smith
- ID Number: 123456789
- Date of Birth: January 15, 1990

\`\`\`artifact:form
{
  "title": "Verify Extracted Information",
  "description": "Please review and confirm the information extracted from your document",
  "fields": {
    "firstName": "John",
    "lastName": "Smith",
    "idNumber": "123456789",
    "dateOfBirth": "1990-01-15",
    "nationality": "South African",
    "gender": "Male",
    "documentType": "National ID Card",
    "documentExpiry": null,
    "documentIssueDate": null
  },
  "validation": {
    "allRequiredFieldsFound": false,
    "missingFields": ["documentExpiry", "documentIssueDate"]
  },
  "actions": ["submit", "cancel"],
  "submitText": "Confirm Information",
  "cancelText": "Re-upload Document"
}
\`\`\`

IMPORTANT: After providing the artifact, you must STOP and wait for the user to confirm the data is correct. Do not continue generating content until the user responds. End your response immediately after the artifact block.

Note: The "fields" object contains ONLY the required parameters for this process. Other information visible in the document (like address, photo, etc.) is NOT included.
---

Always include structured data in JSON code blocks when:
- Extracting form fields from documents
- Validating data
- Providing process outcomes
- Returning calculation results
- Listing options or choices

Current process context:
- Process: ${context.processName}
- Type: ${context.executionModel}
- Domain: ${context.domainId || 'General'}
${context.currentStage ? `- Stage: ${context.currentStage}` : ''}`;
}

/**
 * Process-specific prompt templates
 */
export const PROCESS_PROMPTS = {
  'identity-verification': {
    extract: `Extract ONLY the required identity fields from the uploaded document. 
    DO NOT extract addresses, photos, signatures, or any other information.
    Map the document fields to the exact parameter names provided.
    Present the extracted data in an artifact:form block with a title and description.
    
    If the document is not a valid ID, use error artifact:
    \`\`\`artifact:error
    {
      "error": {
        "code": "document.not_an_id",
        "category": "document",
        "severity": "error",
        "message": "This doesn't appear to be an ID document. Please upload a driver's license, passport, or national ID card."
      },
      "recovery": {
        "suggestions": [
          "Ensure the document is a government-issued ID",
          "Check that the image is clear and not cropped",
          "Supported types: Driver's License, Passport, National ID"
        ],
        "actions": [
          { "label": "Upload New Document", "action": "re-upload" }
        ]
      }
    }
    \`\`\`
    
    If the document is unreadable, use error artifact:
    \`\`\`artifact:error
    {
      "error": {
        "code": "document.unreadable",
        "category": "document",
        "severity": "error",
        "message": "I couldn't read the information from your document clearly."
      },
      "recovery": {
        "suggestions": [
          "Ensure the image is not blurry",
          "Make sure all text is visible and not cut off",
          "Try taking the photo in better lighting",
          "Avoid reflections or shadows on the document"
        ],
        "actions": [
          { "label": "Try Again", "action": "re-upload" }
        ]
      }
    }
    \`\`\`
    
    AFTER providing the artifact, STOP and wait for user confirmation - do not continue generating content.`,
    
    validate: `Validate the extracted identity data and check for:
    - ID/Passport number format
    - Document expiry
    - Field completeness
    Return validation results in a JSON code block.`
  },
  
  'savings-goal-planning': {
    calculate: `Calculate the savings plan based on the provided goals.
    Show the calculation breakdown in text and return the final values in a JSON code block with:
    - monthlyAmount
    - totalSavings
    - interestEarned
    - projectedDate`,
    
    analyze: `Analyze the feasibility of the savings goal and provide recommendations.
    Include a JSON code block with:
    - feasibilityScore (0-100)
    - recommendations (array)
    - alternativeScenarios`
  },
  
  'vehicle-compliance': {
    checklist: `Verify vehicle compliance against the checklist.
    Return a JSON code block with:
    - checklistItems (array with status for each)
    - overallCompliance (boolean)
    - failedItems (array)
    - nextSteps (array)`
  }
};

/**
 * Helper to format field extraction requests
 */
export function createFieldExtractionPrompt(
  fields: string[],
  documentType: string
): string {
  return `Please extract the following fields from the ${documentType}:
${fields.map(f => `- ${f}`).join('\n')}

Provide the extracted data in a JSON code block with a "fields" object containing all the values.
If any field cannot be extracted, set its value to null and explain why in the text.`;
}

/**
 * Helper to format validation requests
 */
export function createValidationPrompt(
  data: any,
  validationRules: string[]
): string {
  return `Please validate the following data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Apply these validation rules:
${validationRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Return the validation results in a JSON code block with:
- "valid" (boolean): overall validation status
- "errors" (array): list of validation errors with field and message
- "warnings" (array): non-critical issues
- "suggestions" (array): improvements or corrections`;
}

/**
 * Example usage in chat streaming
 */
export function enhanceUserMessage(
  message: string,
  processContext: ProcessContext
): string {
  // Auto-detect if user is asking for data extraction
  const extractionKeywords = ['extract', 'get', 'find', 'identify', 'read'];
  const calculationKeywords = ['calculate', 'compute', 'how much', 'total'];
  const hasUploadedFile = message.includes('[Uploaded');
  
  let enhancement = '';
  
  // If file is uploaded and we have required parameters, add extraction instructions
  if (hasUploadedFile && processContext.requiredParameters && processContext.requiredParameters.length > 0) {
    enhancement = `\n\nPlease extract the following required fields from the uploaded document:
${processContext.requiredParameters.map(param => 
  `- ${param.displayName} (${param.name}): ${param.description || param.type}`
).join('\n')}

CRITICAL INSTRUCTIONS:
1. ONLY extract these specific fields - ignore all other information in the document
2. The "fields" object in your artifact must contain ONLY these parameter names
3. Map document labels to our parameter names (e.g., "Surname" → "lastName")
4. Set any missing required field to null (do not omit it)
5. Normalize dates to YYYY-MM-DD format
6. Do NOT add any extra fields that are not in this list
7. Use \`\`\`artifact:form syntax to create an interactive form
8. AFTER providing the artifact, STOP and wait for user confirmation - do not continue generating content`;
  } else if (hasUploadedFile || extractionKeywords.some(kw => message.toLowerCase().includes(kw))) {
    if (processContext.processId === 'identity-verification' && hasUploadedFile) {
      enhancement = '\n\n' + PROCESS_PROMPTS['identity-verification'].extract;
    } else {
      enhancement = '\n\nPlease provide the extracted data in a JSON code block.';
    }
  } else if (calculationKeywords.some(kw => message.toLowerCase().includes(kw))) {
    enhancement = '\n\nPlease show your calculations and provide the final results in a JSON code block.';
  }
  
  return message + enhancement;
}