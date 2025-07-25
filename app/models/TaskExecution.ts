import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskExecution extends Document {
  executionId: string;
  title: string;
  userId: string;
  messages: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  // Spark-specific fields
  domainId?: string;
  masterTaskId?: string;
  masterTaskName?: string;
  executionModel?: string;
  userTaskId?: string; // Reference to UserTask that initiated this execution
  // LibreChat compatibility fields
  endpoint?: string;
  aiModel?: string;
  modelLabel?: string;
  promptPrefix?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  // Tags for organization
  tags?: string[];
  // Agent support
  agentId?: string;
  agentOptions?: Record<string, any>;
  // Files
  files?: mongoose.Types.ObjectId[];
  // System prompt with full context
  systemPrompt?: string;
}

const TaskExecutionSchema = new Schema<ITaskExecution>(
  {
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ExecutionMessage',
      },
    ],
    // Spark-specific fields
    domainId: {
      type: String,
      index: true,
    },
    masterTaskId: {
      type: String,
      index: true,
    },
    masterTaskName: String,
    executionModel: {
      type: String,
      enum: ['form', 'sop', 'knowledge', 'bpmn', 'training'],
    },
    userTaskId: {
      type: String,
      ref: 'UserTask',
      index: true,
    },
    // LibreChat compatibility
    endpoint: {
      type: String,
      default: 'google',
    },
    aiModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    modelLabel: String,
    promptPrefix: String,
    temperature: {
      type: Number,
      default: 0.7,
    },
    topP: {
      type: Number,
      default: 0.95,
    },
    topK: {
      type: Number,
      default: 40,
    },
    maxOutputTokens: {
      type: Number,
      default: 8192,
    },
    tags: [String],
    agentId: String,
    agentOptions: {
      type: Schema.Types.Mixed,
    },
    files: [
      {
        type: Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    systemPrompt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TaskExecutionSchema.index({ userId: 1, createdAt: -1 });
TaskExecutionSchema.index({ userId: 1, domainId: 1 });
TaskExecutionSchema.index({ userId: 1, masterTaskId: 1 });
TaskExecutionSchema.index({ userTaskId: 1, createdAt: -1 }); // For querying executions by UserTask

const TaskExecution = mongoose.models.TaskExecution || mongoose.model<ITaskExecution>('TaskExecution', TaskExecutionSchema, 'taskExecutions');

export default TaskExecution;