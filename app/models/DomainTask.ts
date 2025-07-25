import mongoose, { Document, Schema } from 'mongoose';
import { DomainTask, TaskType, TaskIcon, TaskColorScheme, TaskPriority, TaskCategory } from '@/app/types/post.types';

/**
 * Domain Task Model - QMS Compliant Version
 * 
 * This represents a task that has been adopted by a domain from the master task library.
 * For QMS compliance, this model now contains a COMPLETE SNAPSHOT of all MasterTask data
 * at the time of adoption, not just references.
 * 
 * IMPORTANT: This is an immutable record. Once created, the execution data should not
 * be modified. If the domain wants to update from a newer MasterTask version, they
 * must create a new DomainTask and manage the transition.
 */
export interface IDomainTask extends Document, Omit<DomainTask, 'id'> {
  _id: string;
}

// Sub-schemas for complex nested structures
const SOPProcedureSchema = new Schema({
  stepNumber: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  responsible: { type: String, required: true },
  inputs: [String],
  outputs: [String],
  tools: [String],
  duration: String,
  decisionPoints: [{
    condition: String,
    truePath: String,
    falsePath: String,
    _id: false
  }]
}, { _id: false });

const SOPSchema = new Schema({
  objective: { type: String, required: true },
  scope: {
    included: [String],
    excluded: [String],
    applicableTo: [String]
  },
  policies: {
    compliance: [String],
    standards: [String],
    regulations: [String]
  },
  rolesAndResponsibilities: [{
    role: { type: String, required: true },
    responsibilities: [{ type: String, required: true }],
    requiredSkills: [String],
    _id: false
  }],
  procedures: [SOPProcedureSchema],
  metadata: {
    version: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
    reviewDate: { type: Date, required: true },
    owner: { type: String, required: true },
    approvedBy: { type: String, required: true },
    changeHistory: [{
      version: String,
      date: Date,
      changes: String,
      changedBy: String,
      _id: false
    }]
  }
}, { _id: false });

const ContextDocumentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  url: String
}, { _id: false });

const RequiredParameterSchema = new Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  type: { type: String, required: true, enum: ['string', 'number', 'date', 'boolean'] },
  description: String,
  validation: {
    required: { type: Boolean, default: true },
    pattern: String,
    minLength: Number,
    maxLength: Number
  },
  examples: [String]
}, { _id: false });

const ChecklistItemSchema = new Schema({
  step: Number,
  title: String,
  description: String,
  subSteps: [{
    step: String,
    title: String,
    _id: false
  }]
}, { _id: false });

const CurriculumSchema = new Schema({
  moduleId: { type: String, required: true },
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  required: { type: Boolean, required: true }
}, { _id: false });

const TaskActionSchema = new Schema({
  type: {
    type: String,
    enum: ['navigate', 'external', 'modal', 'process'],
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  params: {
    type: Map,
    of: Schema.Types.Mixed,
  },
}, { _id: false });

const DomainTaskSchema = new Schema<IDomainTask>({
  // Domain-specific fields
  domain: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  taskType: {
    type: String,
    enum: ['identity_verification', 'onboarding', 'training', 'task', 'achievement', 'announcement', 'opportunity', 'compliance'],
    required: true,
  },
  
  // Reference to original MasterTask (for audit trail only)
  masterTaskId: {
    type: String,
    required: true,
    index: true,
  },
  masterTaskVersion: {
    type: String,
    required: true,
  },
  
  // Complete MasterTask execution data (QMS Compliant Snapshot)
  masterTaskSnapshot: {
    // Core MasterTask fields
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['identity', 'onboarding', 'compliance', 'training', 'operational', 'financial']
    },
    executionModel: {
      type: String,
      required: true,
      enum: ['form', 'sop', 'knowledge', 'bpmn', 'training']
    },
    
    // AI Configuration
    aiAgentAttached: { type: Boolean, default: false },
    aiAgentRole: String,
    aiAgentId: String,
    systemPrompt: String,
    intro: String,
    
    // Execution-specific data
    standardOperatingProcedure: SOPSchema,
    contextDocuments: [ContextDocumentSchema],
    requiredParameters: [RequiredParameterSchema],
    checklist: [ChecklistItemSchema],
    
    // Form execution
    formSchema: Schema.Types.Mixed,
    validationRules: Schema.Types.Mixed,
    
    // Workflow execution
    workflowDefinition: Schema.Types.Mixed,
    
    // Training execution
    curriculum: [CurriculumSchema],
    
    // Metadata
    sopMetadata: {
      complianceStandards: [String],
      riskLevel: String,
      estimatedDuration: String,
      requiredApprovals: [String],
      auditRequirements: [String]
    }
  },
  
  // Domain customizations (overlays on top of master data)
  domainCustomizations: {
    title: String,
    description: String,
    estimatedTime: String,
    systemPrompt: String, // Domain can enhance the system prompt
    additionalContext: String,
    reward: {
      amount: Number,
      currency: String,
      displayText: String,
    },
  },
  
  // Domain adoption metadata
  adoptedAt: {
    type: Date,
    default: Date.now,
  },
  adoptedBy: {
    type: String,
    required: true,
  },
  adoptionNotes: String,
  
  // Display configuration
  imageUrl: String,
  iconType: {
    type: String,
    enum: ['shield', 'book', 'checklist', 'trophy', 'megaphone', 'lightbulb', 'briefcase', 'users'],
  },
  colorScheme: {
    type: String,
    enum: ['blue', 'green', 'orange', 'purple', 'gray'],
    default: 'blue',
  },
  ctaText: {
    type: String,
    required: true,
  },
  ctaAction: {
    type: TaskActionSchema,
    required: true,
  },
  
  // Task behavior
  requiresIdentityVerification: {
    type: Boolean,
    default: true,
  },
  prerequisiteTasks: [String],
  nextTasks: [String],
  canHide: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal',
  },
  category: {
    type: String,
    enum: ['required', 'recommended', 'optional'],
    default: 'recommended',
  },
  
  // Additional metadata
  estimatedTime: String,
  reward: {
    amount: Number,
    currency: String,
    displayText: String,
  },
  version: {
    type: String,
    default: '1.0.0',
  },
  
  // Status flags
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isQMSCompliant: {
    type: Boolean,
    default: true, // New documents are compliant
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
DomainTaskSchema.index({ domain: 1, isActive: 1, priority: -1 });
DomainTaskSchema.index({ domain: 1, taskType: 1, isActive: 1 });
DomainTaskSchema.index({ masterTaskId: 1, domain: 1 });

export default mongoose.models.DomainTask || mongoose.model<IDomainTask>('DomainTask', DomainTaskSchema, 'domainTasks');