import mongoose, { Document, Schema } from 'mongoose';
import { UserTask, DomainTaskSnapshot } from '@/app/types/post.types';

/**
 * User Task Model - QMS Compliant Version
 * 
 * Represents an instance of a task assigned to a specific user.
 * For QMS compliance, this model now contains a COMPLETE SNAPSHOT of ALL data
 * from the DomainTask at the time of assignment, including all execution data.
 * 
 * DESIGN PRINCIPLE: UserTasks are immutable snapshots
 * - When created, they capture ALL fields from the domain task including execution data
 * - Changes to domain tasks do NOT affect existing UserTasks
 * - TaskExecutions use ONLY the data in this snapshot, no dynamic fetching
 * - This ensures audit integrity and consistent user experience
 * - Users always execute the exact version that was assigned to them
 */
export interface IUserTask extends Document, Omit<UserTask, 'id'> {
  _id: string;
}

// Sub-schemas for complete execution data snapshot
const SOPProcedureSnapshotSchema = new Schema({
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

const SOPSnapshotSchema = new Schema({
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
  procedures: [SOPProcedureSnapshotSchema],
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

const ContextDocumentSnapshotSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  url: String
}, { _id: false });

const RequiredParameterSnapshotSchema = new Schema({
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

const ChecklistItemSnapshotSchema = new Schema({
  step: Number,
  title: String,
  description: String,
  subSteps: [{
    step: String,
    title: String,
    _id: false
  }]
}, { _id: false });

const CurriculumSnapshotSchema = new Schema({
  moduleId: { type: String, required: true },
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  required: { type: Boolean, required: true }
}, { _id: false });

const TaskActionSnapshotSchema = new Schema({
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
    type: Schema.Types.Mixed,
    default: {}
  },
}, { _id: false });

// Complete domain task snapshot including ALL execution data
const DomainTaskSnapshotSchema = new Schema({
  // Display fields
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: String,
  version: {
    type: String,
    required: true,
  },
  
  // Visual styling
  iconType: {
    type: String,
    enum: ['shield', 'book', 'checklist', 'trophy', 'megaphone', 'lightbulb', 'briefcase', 'users'],
  },
  colorScheme: {
    type: String,
    enum: ['blue', 'green', 'orange', 'purple', 'gray'],
    default: 'blue',
  },
  
  // CTA configuration
  ctaText: {
    type: String,
    required: true,
  },
  ctaAction: {
    type: TaskActionSnapshotSchema,
    required: true,
  },
  
  // Behavior flags
  requiresIdentityVerification: {
    type: Boolean,
    default: true,
  },
  canHide: {
    type: Boolean,
    default: true,
  },
  
  // Categorization
  taskType: {
    type: String,
    enum: ['identity_verification', 'onboarding', 'training', 'task', 'achievement', 'announcement', 'opportunity', 'compliance'],
    required: true,
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
    type: {
      amount: Number,
      currency: String,
      displayText: String,
    },
    default: null,
    required: false
  },
  
  // Relationships (preserved for audit trail)
  prerequisiteTasks: [String],
  nextTasks: [String],
  
  // COMPLETE EXECUTION DATA FROM MASTERTASK (QMS Compliant)
  executionData: {
    type: {
      // Core execution fields
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
      standardOperatingProcedure: SOPSnapshotSchema,
      contextDocuments: [ContextDocumentSnapshotSchema],
      requiredParameters: [RequiredParameterSnapshotSchema],
      checklist: [ChecklistItemSnapshotSchema],
      
      // Form execution
      formSchema: Schema.Types.Mixed,
      validationRules: Schema.Types.Mixed,
      
      // Workflow execution
      workflowDefinition: Schema.Types.Mixed,
      
      // Training execution
      curriculum: [CurriculumSnapshotSchema],
      
      // Metadata
      sopMetadata: {
        complianceStandards: [String],
        riskLevel: String,
        estimatedDuration: String,
        requiredApprovals: [String],
        auditRequirements: [String]
      }
    },
    required: false,
    default: null
  },
  
  // Domain customizations applied
  domainCustomizations: {
    title: String,
    description: String,
    estimatedTime: String,
    systemPrompt: String,
    additionalContext: String,
    reward: {
      amount: Number,
      currency: String,
      displayText: String,
    },
  }
}, { _id: false });

const UserTaskSchema = new Schema<IUserTask>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  domainTaskId: {
    type: String,
    required: true,
    ref: 'DomainTask',
  },
  // Reference to original MasterTask (for audit trail only)
  masterTaskId: {
    type: String,
    ref: 'MasterTask',
    index: true,
  },
  
  // COMPLETE snapshot of domain task at assignment time
  taskSnapshot: {
    type: DomainTaskSnapshotSchema,
    required: true,
  },
  
  // Assignment metadata
  timestampAssigned: {
    type: Date,
    default: Date.now,
  },
  assignedTo: {
    type: String,
    required: true,
    index: true,
  },
  assignedBy: {
    type: String,
    required: true,
    default: 'system',
  },
  assignmentReason: {
    type: String,
    required: true,
  },
  
  // User interaction tracking
  isHidden: {
    type: Boolean,
    default: false,
  },
  hiddenAt: Date,
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  lastViewedAt: Date,
  viewCount: {
    type: Number,
    default: 0,
  },
  
  // Progress tracking
  progress: {
    currentStep: {
      type: Number,
      default: 0,
    },
    totalSteps: {
      type: Number,
      default: 1,
    },
    percentComplete: {
      type: Number,
      default: 0,
    },
  },
  
  // QMS compliance flag
  isQMSCompliant: {
    type: Boolean,
    default: true, // New documents are compliant
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
UserTaskSchema.index({ userId: 1, isCompleted: 1, isHidden: 1, timestampAssigned: -1 });
UserTaskSchema.index({ userId: 1, domainTaskId: 1 }, { unique: true });
UserTaskSchema.index({ assignedTo: 1, timestampAssigned: -1 });

export default mongoose.models.UserTask || mongoose.model<IUserTask>('UserTask', UserTaskSchema, 'userTasks');