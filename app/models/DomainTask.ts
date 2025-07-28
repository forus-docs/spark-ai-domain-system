/**
 * Domain Task Model - QMS Compliant Separate Collection
 * 
 * DomainTasks are complete snapshots of MasterTasks adopted by domains.
 * They are stored in a separate 'domainTasks' collection as per QMS principles.
 * No dynamic linking - only cross-referencing via masterTaskId.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IStandardOperatingProcedure } from './MasterTask';

export interface IDomainTask extends Document {
  // Reference to original MasterTask
  masterTaskId: string;
  
  // Domain that adopted this task
  domain: string; // Required - the domain ID that adopted this
  adoptedAt: Date;
  adoptedBy: string; // User ID who adopted it
  adoptionNotes: string;
  
  // Complete snapshot from MasterTask at adoption time
  name: string;
  description: string;
  category: 'identity' | 'onboarding' | 'compliance' | 'training' | 'operational' | 'financial';
  
  // Execution configuration
  executionModel: 'form' | 'sop' | 'knowledge' | 'bpmn' | 'training';
  currentStage: 'manual' | 'assisted' | 'supervised' | 'automated' | 'ai_promoted';
  
  // Display configuration
  title: string;
  iconType: 'shield' | 'book' | 'checklist' | 'trophy' | 'megaphone' | 'lightbulb' | 'briefcase' | 'users';
  colorScheme: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  ctaText: string;
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
  } | null;
  version: string;
  
  // Task flow
  prerequisiteTasks: string[];
  nextTasks: string[];
  requiresIdentityVerification: boolean;
  canHide: boolean;
  
  // Standard Operating Procedure
  standardOperatingProcedure: IStandardOperatingProcedure | null;
  
  // Domain customizations (applied on top of master)
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
  
  // QMS compliance
  isQMSCompliant: boolean;
  
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
  intro: string;
  contextDocuments: Array<{
    name: string;
    type: string;
    content: string;
    url: string;
  }>;
  
  // Required parameters
  requiredParameters: Array<{
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    description: string;
    validation: {
      required: boolean;
      pattern: string;
      minLength: number;
      maxLength: number;
    };
    examples: string[];
  }>;
  
  // Checklist
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
  
  // Domain-specific metrics
  domainMetrics: {
    totalExecutions: number;
    averageCompletionTime: number;
    averageSuccessRate: number;
    lastExecuted: Date | null;
  };
  
  // Status
  active: boolean;
  isActive: boolean; // Alias for compatibility
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition - mirrors MasterTask but in separate collection
const DomainTaskSchema = new Schema<IDomainTask>(
  {
    // Reference to original
    masterTaskId: { type: String, required: true, index: true },
    
    // Domain ownership
    domain: { type: String, required: true, index: true },
    adoptedAt: { type: Date, required: true, default: Date.now },
    adoptedBy: { type: String, required: true },
    adoptionNotes: { type: String, default: '' },
    
    // All fields from MasterTask schema (complete snapshot)
    name: { type: String, required: true },
    description: { type: String, required: true },
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
    version: { type: String, default: '1.0.0' },
    
    // Task flow
    prerequisiteTasks: { type: [String], default: [] },
    nextTasks: { type: [String], default: [] },
    requiresIdentityVerification: { type: Boolean, default: false },
    canHide: { type: Boolean, default: true },
    
    // Domain customizations
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
    
    // QMS compliance
    isQMSCompliant: { type: Boolean, default: true },
    
    // All other fields from MasterTask schema
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
    aiAgentAttached: { type: Boolean, default: false },
    aiAgentRole: { type: String, default: '' },
    aiAgentId: { type: String, default: '' },
    promotionArtifact: { type: String, default: '' },
    promotionDate: { type: Date, default: null },
    aiCurrentFocus: { type: String, default: '' },
    systemPrompt: { type: String, default: '' },
    intro: { type: String, default: '' },
    contextDocuments: { type: Schema.Types.Mixed, default: [] },
    requiredParameters: { type: Schema.Types.Mixed, default: [] },
    standardOperatingProcedure: { type: Schema.Types.Mixed, default: null },
    checklist: { type: Schema.Types.Mixed, default: [] },
    sopMetadata: { type: Schema.Types.Mixed, default: null },
    formSchema: { type: Schema.Types.Mixed, default: null },
    validationRules: { type: Schema.Types.Mixed, default: null },
    workflowDefinition: { type: Schema.Types.Mixed, default: null },
    curriculum: { type: Schema.Types.Mixed, default: [] },
    
    // Domain-specific metrics
    domainMetrics: {
      totalExecutions: { type: Number, default: 0 },
      averageCompletionTime: { type: Number, default: 0 },
      averageSuccessRate: { type: Number, default: 0 },
      lastExecuted: { type: Date, default: null },
    },
    
    active: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
DomainTaskSchema.index({ domain: 1, isActive: 1 });
DomainTaskSchema.index({ domain: 1, masterTaskId: 1 }, { unique: true });
DomainTaskSchema.index({ domain: 1, category: 1 });
DomainTaskSchema.index({ domain: 1, priority: -1 });
DomainTaskSchema.index({ name: 'text', description: 'text' });

// Create model pointing to 'domainTasks' collection
const DomainTask = mongoose.models.DomainTask || mongoose.model<IDomainTask>('DomainTask', DomainTaskSchema, 'domainTasks');

export default DomainTask;