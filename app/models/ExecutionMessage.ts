import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutionMessage extends Document {
  messageId: string;
  executionId: string;
  parentMessageId?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  text: string; // For compatibility
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Model info
  aiModel?: string;
  endpoint?: string;
  // Token tracking
  tokenCount?: number;
  promptTokens?: number;
  completionTokens?: number;
  // Metadata
  isCreatedByUser?: boolean;
  error?: boolean;
  unfinished?: boolean;
  cancelled?: boolean;
  // Plugin/tool support
  plugin?: {
    name: string;
    pluginId: string;
    outputs?: any;
  };
  plugins?: Array<{
    plugin: string;
    input: any;
    output: any;
  }>;
  // Files
  files?: mongoose.Types.ObjectId[];
  // User feedback
  feedback?: {
    rating: 'thumbsUp' | 'thumbsDown';
    text?: string;
  };
  // Content array for multi-modal messages
  content_parts?: Array<{
    type: 'text' | 'image_url' | 'code' | 'file';
    text?: string;
    image_url?: {
      url: string;
      detail?: 'low' | 'high' | 'auto';
    };
    code?: {
      language: string;
      content: string;
    };
    file?: {
      name: string;
      type: string;
      size: number;
      url: string;
    };
  }>;
}

const ExecutionMessageSchema = new Schema<IExecutionMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    executionId: {
      type: String,
      required: true,
      index: true,
    },
    parentMessageId: {
      type: String,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system', 'tool'],
    },
    content: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    aiModel: String,
    endpoint: {
      type: String,
      default: 'google',
    },
    tokenCount: Number,
    promptTokens: Number,
    completionTokens: Number,
    isCreatedByUser: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    unfinished: {
      type: Boolean,
      default: false,
    },
    cancelled: {
      type: Boolean,
      default: false,
    },
    plugin: {
      name: String,
      pluginId: String,
      outputs: Schema.Types.Mixed,
    },
    plugins: [
      {
        plugin: String,
        input: Schema.Types.Mixed,
        output: Schema.Types.Mixed,
      },
    ],
    files: [
      {
        type: Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    feedback: {
      rating: {
        type: String,
        enum: ['thumbsUp', 'thumbsDown'],
      },
      text: String,
    },
    content_parts: [
      {
        type: {
          type: String,
          enum: ['text', 'image_url', 'code', 'file'],
        },
        text: String,
        image_url: {
          url: String,
          detail: {
            type: String,
            enum: ['low', 'high', 'auto'],
          },
        },
        code: {
          language: String,
          content: String,
        },
        file: {
          name: String,
          type: String,
          size: Number,
          url: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Set text field to match content on save
ExecutionMessageSchema.pre('save', function (next) {
  if (this.content && !this.text) {
    this.text = this.content;
  }
  next();
});

// Indexes for performance
ExecutionMessageSchema.index({ executionId: 1, createdAt: 1 });
ExecutionMessageSchema.index({ userId: 1, createdAt: -1 });
ExecutionMessageSchema.index({ parentMessageId: 1 });

const ExecutionMessage = mongoose.models.ExecutionMessage || mongoose.model<IExecutionMessage>('ExecutionMessage', ExecutionMessageSchema, 'executionMessages');

export default ExecutionMessage;