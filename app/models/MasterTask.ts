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
    qualityChecks?: string[];
    dependencies?: string[];
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
  // Core identification
  masterTaskId: string;
  name: string;
  description: string;
  category: 'identity' | 'onboarding' | 'compliance' | 'training' | 'operational' | 'financial';
  
  // Execution configuration
  executionModel: 'form' | 'sop' | 'knowledge' | 'bpmn' | 'training';
  currentStage: 'manual' | 'assisted' | 'supervised' | 'automated' | 'ai_promoted';
  
  // Display configuration
  title: string; // Display title (defaults to name if empty)
  iconType: 'shield' | 'book' | 'checklist' | 'trophy' | 'megaphone' | 'lightbulb' | 'briefcase' | 'users';
  colorScheme: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  ctaText: string; // Call to action text
  ctaAction: {
    type: string;
    target: string;
    params: Record<string, any>;
  };
  imageUrl: string;
  
  // Task metadata
  taskType: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  estimatedTime: string;
  reward: {
    amount: number;
    currency: string;
    displayText: string;
  } | null; // Use null when no reward
  version: string;
  
  // Task flow
  prerequisiteTasks: string[];
  nextTasks: string[];
  requiresIdentityVerification: boolean;
  canHide: boolean;
  
  // Standard Operating Procedure (for SOP execution model)
  standardOperatingProcedure: IStandardOperatingProcedure | null;
  
  // Domain-specific fields (empty string when not a domain task)
  domain: string; // Domain ID reference (empty string for master tasks)
  domainCustomizations: {
    title: string;
    description: string;
    estimatedTime: string;
    systemPrompt: string;
    additionalContext: string;
    reward: {
      amount: number;
      currency: string;
      displayText: string;
    } | null;
  } | null;
  adoptedAt: Date | null;
  adoptedBy: string;
  adoptionNotes: string;
  
  // User assignment fields (empty string when not a user task)
  userId: string;
  domainTaskId: string;
  assignedTo: string;
  assignedBy: string;
  assignmentReason: string;
  timestampAssigned: Date | null;
  
  // User progress fields
  isCompleted: boolean;
  isHidden: boolean;
  viewCount: number;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
  };
  completedAt: Date | null;
  completionData: Record<string, any> | null;
  params: Record<string, any> | null;
  
  // QMS compliance
  isQMSCompliant: boolean;
  
  // Domain adoption tracking (kept for compatibility but will be deprecated)
  adoptedByDomains: IDomainAdoption[];
  
  // AI Agent info
  aiAgentAttached: boolean;
  aiAgentRole: string;
  aiAgentId: string;
  
  // For promoted processes
  promotionArtifact: string;
  promotionDate: Date | null;
  aiCurrentFocus: string;
  
  // Process-specific data
  systemPrompt: string;
  intro: string; // Initial message to display in chat explaining the workstream
  contextDocuments: Array<{
    name: string;
    type: string;
    content: string;
    url: string;
  }>;
  
  // Required parameters for this process
  requiredParameters: Array<{
    name: string; // e.g., "firstName", "idNumber"
    displayName: string; // e.g., "First Name", "ID Number"
    type: 'string' | 'number' | 'date' | 'boolean';
    description: string; // Help text for AI to understand what to extract
    validation: {
      required: boolean;
      pattern: string; // Regex pattern (empty string if not needed)
      minLength: number;
      maxLength: number;
    };
    examples: string[]; // Examples of valid values
  }>;
  
  // Checklist (for structured task execution)
  checklist: Array<{
    step: number;
    order: number;
    title: string;
    description: string;
    type: string;
    required: boolean;
    completed: boolean;
    subSteps: Array<{
      step: number | string;
      order: number;
      field: string;
      title: string;
      description: string;
      required: boolean;
    }>;
  }>;
  
  // SOP metadata
  sopMetadata: {
    complianceStandards: string[];
    auditTrailRequired: boolean;
    regulatoryBody: string;
    riskLevel: string;
    mandatorySteps: number;
    estimatedDuration: string;
    requiredApprovals: string[];
    auditRequirements: string[];
  } | null;
  
  // For forms
  formSchema: Record<string, any> | null;
  validationRules: Record<string, any> | null;
  
  // For BPMN
  workflowDefinition: Record<string, any> | null;
  
  // For training
  curriculum: Array<{
    moduleId: string;
    name: string;
    duration: number;
    required: boolean;
  }>;
  
  // Global metrics (across all domains)
  globalMetrics: {
    totalExecutions: number;
    averageCompletionTime: number;
    averageSuccessRate: number;
  };
  
  // Legacy fields (for backward compatibility)
  standardizationGoals?: string[];
  potentialAIValue?: string[];
  aiImprovements?: string[];
  
  // Status
  active: boolean;
  isActive: boolean; // Alias for compatibility
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
    qualityChecks: [{ type: String }],
    dependencies: [{ type: String }],
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
    // Core identification
    masterTaskId: {
      type: String,
      required: true,
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
    
    // Display configuration
    title: { type: String, default: '' },
    iconType: {
      type: String,
      enum: ['shield', 'book', 'checklist', 'trophy', 'megaphone', 'lightbulb', 'briefcase', 'users'],
      default: 'checklist'
    },
    colorScheme: {
      type: String,
      enum: ['blue', 'green', 'orange', 'purple', 'gray'],
      default: 'blue',
    },
    ctaText: { type: String, default: 'Start Task' },
    ctaAction: {
      type: { type: String, default: 'process' },
      target: { type: String, default: '' },
      params: { type: Schema.Types.Mixed, default: {} },
    },
    imageUrl: { type: String, default: '' },
    
    // Task metadata
    taskType: { type: String, default: 'task' },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'normal', 'low'],
      default: 'normal',
    },
    estimatedTime: { type: String, default: '' },
    reward: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: '' },
      displayText: { type: String, default: '' },
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    
    // Task flow
    prerequisiteTasks: { type: [String], default: [] },
    nextTasks: { type: [String], default: [] },
    requiresIdentityVerification: {
      type: Boolean,
      default: false,
    },
    canHide: {
      type: Boolean,
      default: true,
    },
    
    // Domain-specific fields
    domain: {
      type: String,
      default: '',
      index: true,
    },
    domainCustomizations: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      estimatedTime: { type: String, default: '' },
      systemPrompt: { type: String, default: '' },
      additionalContext: { type: String, default: '' },
      reward: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: '' },
        displayText: { type: String, default: '' },
      },
    },
    adoptedAt: { type: Date, default: null },
    adoptedBy: { type: String, default: '' },
    adoptionNotes: { type: String, default: '' },
    
    // User assignment fields
    userId: {
      type: String,
      default: '',
      index: true,
    },
    domainTaskId: { type: String, default: '' },
    assignedTo: {
      type: String,
      default: '',
      index: true,
    },
    assignedBy: { type: String, default: '' },
    assignmentReason: {
      type: String,
      default: '',
    },
    timestampAssigned: { type: Date, default: null },
    
    // User progress fields
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    progress: {
      currentStep: { type: Number, default: 0 },
      totalSteps: { type: Number, default: 1 },
      percentComplete: { type: Number, default: 0 },
    },
    completedAt: { type: Date, default: null },
    completionData: { type: Schema.Types.Mixed, default: null },
    params: {
      type: Schema.Types.Mixed,
      default: null,
    },
    
    // QMS compliance
    isQMSCompliant: {
      type: Boolean,
      default: true,
    },
    
    // Checklist (for structured execution)
    checklist: { type: Schema.Types.Mixed, default: [] },
    
    // SOP metadata
    sopMetadata: { type: Schema.Types.Mixed, default: null },
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
    aiAgentRole: { type: String, default: '' },
    aiAgentId: { type: String, default: '' },
    promotionArtifact: { type: String, default: '' },
    promotionDate: { type: Date, default: null },
    aiCurrentFocus: { type: String, default: '' },
    systemPrompt: { type: String, default: '' },
    intro: { type: String, default: '' },
    contextDocuments: { type: [contextDocumentSchema], default: [] },
    requiredParameters: { type: [requiredParameterSchema], default: [] },
    standardOperatingProcedure: { type: sopSchema, default: null },
    formSchema: { type: Schema.Types.Mixed, default: null },
    validationRules: { type: Schema.Types.Mixed, default: null },
    workflowDefinition: { type: Schema.Types.Mixed, default: null },
    curriculum: { type: [curriculumSchema], default: [] },
    globalMetrics: {
      totalExecutions: { type: Number, default: 0 },
      averageCompletionTime: { type: Number, default: 0 },
      averageSuccessRate: { type: Number, default: 0 },
    },
    // Legacy fields for backward compatibility
    standardizationGoals: { type: [String], default: [] },
    potentialAIValue: { type: [String], default: [] },
    aiImprovements: { type: [String], default: [] },
    active: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes with readable names
MasterTaskSchema.index({ 'adoptedByDomains.domainId': 1 }, { name: 'idx_adopted_domains' });
MasterTaskSchema.index({ category: 1, executionModel: 1 }, { name: 'idx_category_model' });
MasterTaskSchema.index({ 'adoptedByDomains.domainId': 1, 'adoptedByDomains.isActive': 1 }, { name: 'idx_adopted_domains_active' });
MasterTaskSchema.index({ name: 'text', description: 'text' }, { name: 'idx_text_search' });

// Additional indexes for unified schema
MasterTaskSchema.index({ domain: 1, isActive: 1 }, { name: 'idx_domain_active' });
MasterTaskSchema.index({ domain: 1, isActive: 1, priority: -1 }, { name: 'idx_domain_active_priority' });
MasterTaskSchema.index({ isActive: 1, domain: 1 }, { name: 'idx_active_domain' });
MasterTaskSchema.index({ userId: 1, domain: 1, isActive: 1 }, { name: 'idx_user_domain_active' });
MasterTaskSchema.index({ userId: 1, isCompleted: 1 }, { name: 'idx_user_completed' });
MasterTaskSchema.index({ assignedTo: 1, timestampAssigned: -1 }, { name: 'idx_assigned_to_time' });
MasterTaskSchema.index({ assignedBy: 1, timestampAssigned: -1 }, { name: 'idx_assigned_by_time' });

const MasterTask = mongoose.models.MasterTask || mongoose.model<IMasterTask>('MasterTask', MasterTaskSchema, 'masterTasks');

export default MasterTask;