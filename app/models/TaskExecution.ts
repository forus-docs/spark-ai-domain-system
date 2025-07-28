import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITaskExecution extends Document {
  // Identity
  executionId: string;
  userId: Types.ObjectId;
  domainId: Types.ObjectId;
  domainTaskId: Types.ObjectId;
  
  // Task snapshot - complete immutable copy from DomainTask at time of assignment
  // This is a complete snapshot - no structure enforced to maintain QMS compliance
  taskSnapshot: any;
  
  // Execution state
  status: 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedAt: Date;
  startedAt?: Date; // When first message is sent
  completedAt?: Date;
  procedureStates?: Record<number, 'todo' | 'in_progress' | 'done'>;
  formData?: Record<string, any>; // Collected form data
  
  // Chat messages
  messages: Types.ObjectId[];
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskExecutionSchema = new Schema<ITaskExecution>({
  // Identity
  executionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  domainId: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  domainTaskId: { type: Schema.Types.ObjectId, ref: 'DomainTask', required: true },
  
  // Task snapshot - complete immutable copy from DomainTask
  // Using Mixed type to accept the snapshot exactly as it comes from DomainTask
  taskSnapshot: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // Execution state
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'failed'],
    default: 'assigned',
    required: true
  },
  assignedAt: { type: Date, required: true, default: Date.now },
  startedAt: Date,
  completedAt: Date,
  procedureStates: { type: Map, of: String },
  formData: { type: Map, of: Schema.Types.Mixed },
  
  // Chat messages
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'ExecutionMessage'
  }],
  
  // Metadata
  metadata: { type: Map, of: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Indexes with readable names
TaskExecutionSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_user_recent' });
// executionId already has unique index from schema definition
TaskExecutionSchema.index({ domainTaskId: 1 }, { name: 'idx_domain_task' });
TaskExecutionSchema.index({ userId: 1, status: 1 }, { name: 'idx_user_status' });
TaskExecutionSchema.index({ domainId: 1, userId: 1 }, { name: 'idx_domain_user' });
TaskExecutionSchema.index({ userId: 1, domainId: 1, status: 1 }, { name: 'idx_user_domain_status' });

// Update status to in_progress when first message is sent
TaskExecutionSchema.pre('save', function(next) {
  if (this.isModified('messages') && this.messages.length > 0 && !this.startedAt) {
    this.startedAt = new Date();
    if (this.status === 'assigned') {
      this.status = 'in_progress';
    }
  }
  next();
});

const TaskExecution = mongoose.models.TaskExecution || mongoose.model<ITaskExecution>('TaskExecution', TaskExecutionSchema, 'taskExecutions');

export default TaskExecution;