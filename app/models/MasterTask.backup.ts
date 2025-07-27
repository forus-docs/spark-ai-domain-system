import mongoose, { Schema, Document } from 'mongoose';

// Standard Operating Procedure structure
export interface IStandardOperatingProcedure {
  objective: string;
  scope: {
    included: string[];
    excluded: string[];
    applicableTo: string[];
  };
  policies: {
    compliance: string[];
    standards: string[];
    regulations: string[];
  };
  rolesAndResponsibilities: Array<{
    role: string;
    responsibilities: string[];
    requiredSkills?: string[];
  }>;
  procedures: Array<{
    stepNumber: number;
    name: string;
    description: string;
    responsible: string;
    inputs?: string[];
    outputs?: string[];
    tools?: string[];
    duration?: string;
    decisionPoints?: Array<{
      condition: string;
      truePath: string;
      falsePath: string;
    }>;
  }>;
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
  };
}

export interface IDomainAdoption {
  domainId: string;
  adoptedAt: Date;
  allowedRoles: string[];
  customName?: string; // Domain can customize the process name
  customDescription?: string; // Domain can customize the description
  isActive: boolean;
  metrics?: {
    executionCount: number;
    averageCompletionTime: number;
    successRate: number;
  };
}

export interface IMasterTask extends Document {
  masterTaskId: string;
  name: string;
  description: string;
  category: 'identity' | 'onboarding' | 'compliance' | 'training' | 'operational' | 'financial';
  executionModel: 'form' | 'sop' | 'knowledge' | 'bpmn' | 'training';
  currentStage: 'manual' | 'assisted' | 'supervised' | 'automated' | 'ai_promoted';
  // Standard Operating Procedure (for SOP execution model)
  standardOperatingProcedure?: IStandardOperatingProcedure;
  // Domain adoption tracking
  adoptedByDomains: IDomainAdoption[];
  // AI Agent info
  aiAgentAttached: boolean;
  aiAgentRole?: string;
  aiAgentId?: string;
  // For promoted processes
  promotionArtifact?: string;
  promotionDate?: Date;
  aiCurrentFocus?: string;
  // Process-specific data
  systemPrompt?: string;
  intro?: string; // Initial message to display in chat explaining the workstream
  contextDocuments?: Array<{
    name: string;
    type: string;
    content: string;
    url?: string;
  }>;
  // Required parameters for this process
  requiredParameters?: Array<{
    name: string; // e.g., "firstName", "idNumber"
    displayName: string; // e.g., "First Name", "ID Number"
    type: 'string' | 'number' | 'date' | 'boolean';
    description?: string; // Help text for AI to understand what to extract
    validation?: {
      required: boolean;
      pattern?: string; // Regex pattern
      minLength?: number;
      maxLength?: number;
    };
    examples?: string[]; // Examples of valid values
  }>;
  // For forms
  formSchema?: Record<string, any>;
  validationRules?: Record<string, any>;
  // For BPMN
  workflowDefinition?: Record<string, any>;
  // For training
  curriculum?: Array<{
    moduleId: string;
    name: string;
    duration: number;
    required: boolean;
  }>;
  // Global metrics (across all domains)
  globalMetrics?: {
    totalExecutions: number;
    averageCompletionTime: number;
    averageSuccessRate: number;
  };
  // Status
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define subdocument schema for domain adoption
const domainAdoptionSchema = new Schema({
  domainId: { type: String, required: true },
  adoptedAt: { type: Date, required: true, default: Date.now },
  allowedRoles: [{ type: String, required: true }],
  customName: { type: String },
  customDescription: { type: String },
  isActive: { type: Boolean, default: true },
  metrics: {
    executionCount: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  }
}, { _id: false });

// Define subdocument schema for context documents
const contextDocumentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  url: { type: String, required: false }
}, { _id: false });

// Define subdocument schema for curriculum
const curriculumSchema = new Schema({
  moduleId: { type: String, required: true },
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  required: { type: Boolean, required: true }
}, { _id: false });

// Define subdocument schema for SOP
const sopSchema = new Schema({
  objective: { type: String, required: true },
  scope: {
    included: [{ type: String }],
    excluded: [{ type: String }],
    applicableTo: [{ type: String }]
  },
  policies: {
    compliance: [{ type: String }],
    standards: [{ type: String }],
    regulations: [{ type: String }]
  },
  rolesAndResponsibilities: [{
    role: { type: String, required: true },
    responsibilities: [{ type: String, required: true }],
    requiredSkills: [{ type: String }]
  }],
  procedures: [{
    stepNumber: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    responsible: { type: String, required: true },
    inputs: [{ type: String }],
    outputs: [{ type: String }],
    tools: [{ type: String }],
    duration: { type: String },
    decisionPoints: [{
      condition: { type: String },
      truePath: { type: String },
      falsePath: { type: String }
    }]
  }],
  metadata: {
    version: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
    reviewDate: { type: Date, required: true },
    owner: { type: String, required: true },
    approvedBy: { type: String, required: true },
    changeHistory: [{
      version: { type: String },
      date: { type: Date },
      changes: { type: String },
      changedBy: { type: String }
    }]
  }
}, { _id: false });

// Define subdocument schema for required parameters
const requiredParameterSchema = new Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  type: { type: String, required: true, enum: ['string', 'number', 'date', 'boolean'] },
  description: { type: String },
  validation: {
    required: { type: Boolean, default: true },
    pattern: { type: String },
    minLength: { type: Number },
    maxLength: { type: Number }
  },
  examples: [{ type: String }]
}, { _id: false });

const MasterTaskSchema = new Schema<IMasterTask>(
  {
    masterTaskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['identity', 'onboarding', 'compliance', 'training', 'operational', 'financial'],
    },
    executionModel: {
      type: String,
      required: true,
      enum: ['form', 'sop', 'knowledge', 'bpmn', 'training'],
    },
    currentStage: {
      type: String,
      required: true,
      enum: ['manual', 'assisted', 'supervised', 'automated', 'ai_promoted'],
    },
    adoptedByDomains: {
      type: [domainAdoptionSchema],
      default: [],
    },
    aiAgentAttached: {
      type: Boolean,
      default: false,
    },
    aiAgentRole: String,
    aiAgentId: String,
    promotionArtifact: String,
    promotionDate: Date,
    aiCurrentFocus: String,
    systemPrompt: String,
    intro: String,
    contextDocuments: [contextDocumentSchema],
    requiredParameters: [requiredParameterSchema],
    standardOperatingProcedure: sopSchema,
    formSchema: Schema.Types.Mixed,
    validationRules: Schema.Types.Mixed,
    workflowDefinition: Schema.Types.Mixed,
    curriculum: [curriculumSchema],
    globalMetrics: {
      totalExecutions: { type: Number, default: 0 },
      averageCompletionTime: { type: Number, default: 0 },
      averageSuccessRate: { type: Number, default: 0 },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
MasterTaskSchema.index({ 'adoptedByDomains.domainId': 1 });
MasterTaskSchema.index({ category: 1, executionModel: 1 });
MasterTaskSchema.index({ 'adoptedByDomains.domainId': 1, 'adoptedByDomains.isActive': 1 });
MasterTaskSchema.index({ name: 'text', description: 'text' });

const MasterTask = mongoose.models.MasterTask || mongoose.model<IMasterTask>('MasterTask', MasterTaskSchema, 'masterTasks');

export default MasterTask;