import TaskExecution, { ITaskExecution } from '@/app/models/TaskExecution';
import ExecutionMessage, { IExecutionMessage } from '@/app/models/ExecutionMessage';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTaskExecutionParams {
  userId: string;
  title?: string;
  domainTaskId?: string;
  executionModel?: string;
  userTaskId?: string; // Reference to UserTask that initiated this execution
  model?: string;
  systemPrompt?: string;
}

export interface CreateExecutionMessageParams {
  executionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parentMessageId?: string;
  model?: string;
  tokenCount?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export class TaskExecutionService {
  /**
   * Create a new task execution
   */
  static async createTaskExecution(params: CreateTaskExecutionParams): Promise<ITaskExecution> {
    const executionId = uuidv4();
    
    const taskExecution = new TaskExecution({
      executionId,
      userId: params.userId,
      title: params.title || 'New Task Execution',
      domainTaskId: params.domainTaskId,
      executionModel: params.executionModel,
      userTaskId: params.userTaskId, // Link to UserTask
      aiModel: params.model || 'gemini-1.5-flash',
      systemPrompt: params.systemPrompt, // Store the full context
      messages: [],
    });

    return await taskExecution.save();
  }

  /**
   * Get task execution by ID
   */
  static async getTaskExecution(executionId: string): Promise<ITaskExecution | null> {
    return await TaskExecution.findOne({ executionId })
      .populate('messages')
      .exec();
  }

  /**
   * Get user's task executions
   */
  static async getUserTaskExecutions(
    userId: string,
    domainId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ITaskExecution[]> {
    const query: any = { userId };
    // Note: domainId filtering happens in the API route since TaskExecution doesn't have domainId field

    return await TaskExecution.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Get task executions for a UserTask
   */
  static async getTaskExecutionsByUserTask(
    userTaskId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ITaskExecution[]> {
    return await TaskExecution.find({ userTaskId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Update task execution title
   */
  static async updateTaskExecutionTitle(
    executionId: string,
    title: string
  ): Promise<ITaskExecution | null> {
    return await TaskExecution.findOneAndUpdate(
      { executionId },
      { title },
      { new: true }
    ).exec();
  }

  /**
   * Delete task execution and its messages
   */
  static async deleteTaskExecution(executionId: string): Promise<boolean> {
    // Delete all messages first
    await ExecutionMessage.deleteMany({ executionId });
    
    // Delete the task execution
    const result = await TaskExecution.deleteOne({ executionId });
    
    return result.deletedCount > 0;
  }
}

export class ExecutionMessageService {
  /**
   * Create a new message
   */
  static async createMessage(params: CreateExecutionMessageParams): Promise<IExecutionMessage> {
    const messageId = uuidv4();
    
    const message = new ExecutionMessage({
      messageId,
      executionId: params.executionId,
      userId: params.userId,
      role: params.role,
      content: params.content,
      text: params.content,
      parentMessageId: params.parentMessageId,
      aiModel: params.model,
      tokenCount: params.tokenCount,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      isCreatedByUser: params.role === 'user',
    });

    const savedMessage = await message.save();

    // Add message to task execution
    await TaskExecution.findOneAndUpdate(
      { executionId: params.executionId },
      { $push: { messages: savedMessage._id } }
    );

    return savedMessage;
  }

  /**
   * Get messages for a task execution
   */
  static async getExecutionMessages(
    executionId: string,
    limit?: number
  ): Promise<IExecutionMessage[]> {
    const query = ExecutionMessage.find({ executionId })
      .sort({ createdAt: 1 });

    if (limit) {
      query.limit(limit);
    }

    return await query.exec();
  }

  /**
   * Update message feedback
   */
  static async updateMessageFeedback(
    messageId: string,
    feedback: { rating: 'thumbsUp' | 'thumbsDown'; text?: string }
  ): Promise<IExecutionMessage | null> {
    return await ExecutionMessage.findOneAndUpdate(
      { messageId },
      { feedback },
      { new: true }
    ).exec();
  }

  /**
   * Get message by ID
   */
  static async getMessage(messageId: string): Promise<IExecutionMessage | null> {
    return await ExecutionMessage.findOne({ messageId }).exec();
  }

  /**
   * Update message content (for edits)
   */
  static async updateMessageContent(
    messageId: string,
    content: string
  ): Promise<IExecutionMessage | null> {
    return await ExecutionMessage.findOneAndUpdate(
      { messageId },
      { content, text: content },
      { new: true }
    ).exec();
  }
}