import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  conversationId: string;
  title: string;
  userId: string;
  messages: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  // Spark-specific fields
  domainId?: string;
  processId?: string;
  processName?: string;
  executionModel?: string;
  userPostId?: string; // Reference to UserPost that initiated this conversation
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

const ConversationSchema = new Schema<IConversation>(
  {
    conversationId: {
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
        ref: 'Message',
      },
    ],
    // Spark-specific fields
    domainId: {
      type: String,
      index: true,
    },
    processId: {
      type: String,
      index: true,
    },
    processName: String,
    executionModel: {
      type: String,
      enum: ['form', 'sop', 'knowledge', 'bpmn', 'training'],
    },
    userPostId: {
      type: String,
      ref: 'UserPost',
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
ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ userId: 1, domainId: 1 });
ConversationSchema.index({ userId: 1, processId: 1 });
ConversationSchema.index({ userPostId: 1, createdAt: -1 }); // For querying conversations by UserPost

const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;