/**
 * AI-Friendly Error Code System
 * 
 * Design Principles:
 * 1. Human-readable codes (no cryptic numbers)
 * 2. Hierarchical structure (category.specific)
 * 3. Clear, actionable messages
 * 4. AI can understand and explain to users
 */

export interface ErrorResponse {
  code: string;
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: 'error' | 'warning' | 'info';
  suggestions?: string[];
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  DOCUMENT = 'document',
  PROCESS = 'process',
  SYSTEM = 'system',
  PERMISSION = 'permission',
  DATA = 'data'
}

/**
 * Error codes that AI can understand and handle
 * Format: CATEGORY.SPECIFIC_ERROR
 */
export const ErrorCodes = {
  // Document Processing Errors
  DOCUMENT: {
    NOT_AN_ID: {
      code: 'document.not_an_id',
      message: 'Uploaded document is not a valid identity document',
      userMessage: 'This doesn\'t appear to be an ID document. Please upload a driver\'s license, passport, or national ID card.',
      category: ErrorCategory.DOCUMENT,
      severity: 'error' as const,
      suggestions: [
        'Ensure the document is a government-issued ID',
        'Check that the image is clear and not cropped',
        'Supported types: Driver\'s License, Passport, National ID'
      ]
    },
    UNREADABLE: {
      code: 'document.unreadable',
      message: 'Failed to read required metadata from document',
      userMessage: 'I couldn\'t read the information from your document clearly.',
      category: ErrorCategory.DOCUMENT,
      severity: 'error' as const,
      suggestions: [
        'Ensure the image is not blurry',
        'Make sure all text is visible and not cut off',
        'Try taking the photo in better lighting',
        'Avoid reflections or shadows on the document'
      ]
    },
    WRONG_FORMAT: {
      code: 'document.wrong_format',
      message: 'Document format not supported',
      userMessage: 'This file format is not supported for document processing.',
      category: ErrorCategory.DOCUMENT,
      severity: 'error' as const,
      suggestions: [
        'Supported formats: JPG, PNG, PDF',
        'Convert your document to a supported format',
        'Ensure file size is under 10MB'
      ]
    },
    EXPIRED: {
      code: 'document.expired',
      message: 'Document has expired',
      userMessage: 'Your document appears to be expired.',
      category: ErrorCategory.DOCUMENT,
      severity: 'warning' as const,
      suggestions: [
        'Upload a current, valid document',
        'Check the expiration date on your document',
        'Some processes may still continue with expired documents'
      ]
    }
  },

  // Validation Errors
  VALIDATION: {
    MISSING_REQUIRED: {
      code: 'validation.missing_required',
      message: 'Required fields are missing',
      userMessage: 'Some required information is missing.',
      category: ErrorCategory.VALIDATION,
      severity: 'error' as const,
      suggestions: [
        'Review all fields marked with asterisk (*)',
        'Ensure all required fields have values',
        'Check for any validation messages'
      ]
    },
    INVALID_FORMAT: {
      code: 'validation.invalid_format',
      message: 'Field format is invalid',
      userMessage: 'The information provided doesn\'t match the expected format.',
      category: ErrorCategory.VALIDATION,
      severity: 'error' as const,
      suggestions: [
        'Check date formats (YYYY-MM-DD)',
        'Ensure ID numbers don\'t contain spaces',
        'Verify phone numbers include country code'
      ]
    },
    OUT_OF_RANGE: {
      code: 'validation.out_of_range',
      message: 'Value is outside acceptable range',
      userMessage: 'The value provided is outside the acceptable range.',
      category: ErrorCategory.VALIDATION,
      severity: 'warning' as const,
      suggestions: [
        'Check minimum and maximum values',
        'Ensure dates are reasonable',
        'Verify numeric values are within limits'
      ]
    }
  },

  // Process Errors
  PROCESS: {
    STEP_FAILED: {
      code: 'process.step_failed',
      message: 'Process step could not be completed',
      userMessage: 'I couldn\'t complete this step of the process.',
      category: ErrorCategory.PROCESS,
      severity: 'error' as const,
      suggestions: [
        'Review the previous steps',
        'Ensure all prerequisites are met',
        'Try again or contact support'
      ]
    },
    PREREQUISITE_NOT_MET: {
      code: 'process.prerequisite_not_met',
      message: 'Process prerequisites not satisfied',
      userMessage: 'You need to complete some steps before proceeding.',
      category: ErrorCategory.PROCESS,
      severity: 'info' as const,
      suggestions: [
        'Complete all previous steps first',
        'Check your progress in the sidebar',
        'Some processes require identity verification first'
      ]
    },
    COMPLIANCE_VIOLATION: {
      code: 'process.compliance_violation',
      message: 'Action would violate compliance rules',
      userMessage: 'This action doesn\'t comply with the required policies.',
      category: ErrorCategory.PROCESS,
      severity: 'error' as const,
      suggestions: [
        'Review the compliance requirements',
        'Ensure all policies are followed',
        'Contact your compliance officer if needed'
      ]
    }
  },

  // System Errors
  SYSTEM: {
    SERVICE_UNAVAILABLE: {
      code: 'system.service_unavailable',
      message: 'Required service is temporarily unavailable',
      userMessage: 'The service is temporarily unavailable. Please try again.',
      category: ErrorCategory.SYSTEM,
      severity: 'error' as const,
      suggestions: [
        'Wait a few moments and try again',
        'Check your internet connection',
        'If problem persists, contact support'
      ]
    },
    AI_PROCESSING_ERROR: {
      code: 'system.ai_processing_error',
      message: 'AI processing encountered an error',
      userMessage: 'I encountered an error while processing your request.',
      category: ErrorCategory.SYSTEM,
      severity: 'error' as const,
      suggestions: [
        'Try rephrasing your request',
        'Ensure uploaded files are clear',
        'Break complex requests into smaller parts'
      ]
    }
  },

  // Permission Errors
  PERMISSION: {
    UNAUTHORIZED: {
      code: 'permission.unauthorized',
      message: 'User not authorized for this action',
      userMessage: 'You don\'t have permission to perform this action.',
      category: ErrorCategory.PERMISSION,
      severity: 'error' as const,
      suggestions: [
        'Check if you\'re logged in',
        'Verify your role has necessary permissions',
        'Contact your administrator for access'
      ]
    },
    DOMAIN_REQUIRED: {
      code: 'permission.domain_required',
      message: 'Domain membership required',
      userMessage: 'You need to join a domain to access this feature.',
      category: ErrorCategory.PERMISSION,
      severity: 'info' as const,
      suggestions: [
        'Browse available domains',
        'Join a domain that matches your needs',
        'Some features are domain-specific'
      ]
    }
  },

  // Data Errors
  DATA: {
    NOT_FOUND: {
      code: 'data.not_found',
      message: 'Requested data not found',
      userMessage: 'I couldn\'t find the information you\'re looking for.',
      category: ErrorCategory.DATA,
      severity: 'warning' as const,
      suggestions: [
        'Check if the item exists',
        'Verify the ID or reference',
        'It may have been removed or archived'
      ]
    },
    EXTRACTION_FAILED: {
      code: 'data.extraction_failed',
      message: 'Failed to extract data from source',
      userMessage: 'I couldn\'t extract the information from the provided source.',
      category: ErrorCategory.DATA,
      severity: 'error' as const,
      suggestions: [
        'Ensure the source contains the expected data',
        'Check if the format is supported',
        'Try providing the information manually'
      ]
    }
  }
} as const;

/**
 * Helper function to create error response
 */
export function createErrorResponse(
  error: keyof typeof ErrorCodes.DOCUMENT | 
        keyof typeof ErrorCodes.VALIDATION | 
        keyof typeof ErrorCodes.PROCESS |
        keyof typeof ErrorCodes.SYSTEM |
        keyof typeof ErrorCodes.PERMISSION |
        keyof typeof ErrorCodes.DATA,
  category: keyof typeof ErrorCodes,
  additionalInfo?: Partial<ErrorResponse>
): ErrorResponse {
  const categoryErrors = ErrorCodes[category] as any;
  const errorDef = categoryErrors[error];
  return {
    ...errorDef,
    ...additionalInfo
  };
}

/**
 * AI Prompt Helper for Error Handling
 */
export const AI_ERROR_HANDLING_PROMPT = `
When encountering errors, use the following error codes in your responses:

DOCUMENT ERRORS:
- document.not_an_id: When uploaded file is not an ID document
- document.unreadable: When cannot extract data from document
- document.wrong_format: When file format is not supported
- document.expired: When document expiration date has passed

VALIDATION ERRORS:
- validation.missing_required: When required fields are empty
- validation.invalid_format: When data doesn't match expected format
- validation.out_of_range: When values exceed acceptable limits

PROCESS ERRORS:
- process.step_failed: When a process step cannot be completed
- process.prerequisite_not_met: When prerequisites aren't satisfied
- process.compliance_violation: When action violates policies

When reporting errors:
1. Use the error code in your response
2. Explain the issue clearly
3. Provide actionable suggestions
4. Remain helpful and professional

Example response with error:
"I encountered an issue with your document (error: document.unreadable). The image quality makes it difficult to read the text. Please try:
- Taking a clearer photo with better lighting
- Ensuring all text is visible
- Avoiding shadows or reflections"
`;

/**
 * Error artifact format for structured error responses
 */
export interface ErrorArtifact {
  type: 'error';
  error: {
    code: string;
    category: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    details?: any;
  };
  recovery: {
    suggestions: string[];
    actions?: Array<{
      label: string;
      action: string;
    }>;
  };
}