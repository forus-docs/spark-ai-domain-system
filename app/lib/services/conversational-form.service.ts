import { Form } from '@bpmn-io/form-js-viewer';

export interface FormComponent {
  type: 'textfield' | 'datetime' | 'select' | 'number' | 'checkbox' | 'textarea';
  id: string;
  key: string;
  label: string;
  dateLabel?: string; // For datetime fields
  values?: Array<{    // For select fields
    label: string;
    value: string;
  }>;
  validate?: {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface FormSchema {
  type: string;
  id: string;
  components: FormComponent[];
}

export interface ConversationalMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'form-field' | 'form-review' | 'file-upload';
  fieldKey?: string;
  fieldValue?: any;
  schema?: FormSchema;
  data?: Record<string, any>;
  actions?: Array<{
    label: string;
    value: any;
  }>;
}

export class ConversationalFormRenderer {
  private schema: FormSchema;
  private formData: Record<string, any> = {};
  private currentComponentIndex: number = 0;
  private extractedData: Record<string, any> = {};

  constructor(schema: FormSchema) {
    this.schema = schema;
  }

  // Set extracted data from AI document processing
  setExtractedData(data: Record<string, any>) {
    this.extractedData = data;
  }

  // Get the next field to collect
  getNextField(): FormComponent | null {
    if (this.currentComponentIndex >= this.schema.components.length) {
      return null;
    }
    return this.schema.components[this.currentComponentIndex];
  }

  // Generate conversational message for field collection
  generateFieldMessage(component: FormComponent, extracted?: any): ConversationalMessage {
    if (extracted !== undefined && extracted !== null) {
      // AI found this field
      return {
        role: 'assistant',
        content: `I found your ${component.label}: "${extracted}". Is this correct?`,
        type: 'form-field',
        fieldKey: component.key,
        fieldValue: extracted,
        actions: [
          { label: 'Yes, that\'s correct', value: extracted },
          { label: 'No, let me correct it', value: null }
        ]
      };
    } else {
      // Need to collect manually
      let prompt = `Please provide your ${component.label}`;
      
      // Add validation hints
      if (component.validate?.pattern) {
        prompt += ` (format: ${this.getPatternHint(component.validate.pattern)})`;
      }
      
      return {
        role: 'assistant',
        content: prompt,
        type: 'form-field',
        fieldKey: component.key
      };
    }
  }

  // Validate field value
  validateField(component: FormComponent, value: any): { isValid: boolean; error?: string } {
    if (!component.validate) {
      return { isValid: true };
    }

    const { required, pattern, minLength, maxLength } = component.validate;

    if (required && !value) {
      return { isValid: false, error: `${component.label} is required` };
    }

    if (pattern && value) {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return { isValid: false, error: `${component.label} format is invalid` };
      }
    }

    if (minLength && value && value.length < minLength) {
      return { isValid: false, error: `${component.label} must be at least ${minLength} characters` };
    }

    if (maxLength && value && value.length > maxLength) {
      return { isValid: false, error: `${component.label} must be no more than ${maxLength} characters` };
    }

    return { isValid: true };
  }

  // Process user response and move to next field
  processFieldResponse(fieldKey: string, value: any): { 
    isValid: boolean; 
    error?: string; 
    nextMessage?: ConversationalMessage;
    isComplete?: boolean;
  } {
    const component = this.schema.components.find(c => c.key === fieldKey);
    if (!component) {
      return { isValid: false, error: 'Field not found' };
    }

    const validation = this.validateField(component, value);
    if (!validation.isValid) {
      return validation;
    }

    // Store the valid value
    this.formData[fieldKey] = value;
    this.currentComponentIndex++;

    // Check if we have more fields
    const nextField = this.getNextField();
    if (nextField) {
      const extractedValue = this.extractedData[nextField.key];
      return {
        isValid: true,
        nextMessage: this.generateFieldMessage(nextField, extractedValue)
      };
    }

    // All fields collected - generate review message
    return {
      isValid: true,
      isComplete: true,
      nextMessage: this.generateReviewMessage()
    };
  }

  // Generate final review message with complete form
  generateReviewMessage(): ConversationalMessage {
    return {
      role: 'assistant',
      content: 'I\'ve collected all your information. Please review and confirm:',
      type: 'form-review',
      schema: this.schema,
      data: this.formData
    };
  }

  // Get pattern hint for user
  private getPatternHint(pattern: string): string {
    // Common patterns
    if (pattern.includes('[A-Z0-9]')) {
      return 'letters and numbers only';
    }
    if (pattern.includes('\\d{4}')) {
      return '4 digits';
    }
    if (pattern.includes('@')) {
      return 'email format';
    }
    return 'specific format required';
  }

  // Get current form data
  getFormData(): Record<string, any> {
    return { ...this.formData };
  }

  // Reset the renderer
  reset() {
    this.formData = {};
    this.currentComponentIndex = 0;
    this.extractedData = {};
  }

  // Create form-js instance for final review
  async createReviewForm(container: HTMLElement): Promise<Form> {
    const form = new Form({
      container
    });

    await form.importSchema(this.schema, this.formData);
    return form;
  }

  // Start conversational flow
  startConversation(): ConversationalMessage {
    const firstField = this.getNextField();
    if (!firstField) {
      return {
        role: 'assistant',
        content: 'No fields to collect.',
        type: 'text'
      };
    }

    const extractedValue = this.extractedData[firstField.key];
    return this.generateFieldMessage(firstField, extractedValue);
  }
}