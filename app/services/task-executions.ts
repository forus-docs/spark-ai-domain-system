import TaskExecution, { ITaskExecution } from '@/app/models/TaskExecution';
import ExecutionMessage, { IExecutionMessage } from '@/app/models/ExecutionMessage';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTaskExecutionParams {
  userId: string;
  domainId: string;
  domainTaskId: string;
  taskSnapshot: any; // Complete task data
  executionId?: string;
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
   * Note: This is typically called from the assign route, not directly
   */
  static async createTaskExecution(params: CreateTaskExecutionParams): Promise<ITaskExecution> {
    const executionId = params.executionId || uuidv4();
    
    const taskExecution = new TaskExecution({
      executionId,
      userId: params.userId,
      domainId: params.domainId,
      domainTaskId: params.domainTaskId,
      taskSnapshot: params.taskSnapshot,
      status: 'assigned',
      assignedAt: new Date(),
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
    // Build query to find tasks where user is either the owner OR a member (for workstreams)
    const query: any = {
      $or: [
        { userId }, // User owns the task
        { 'taskSnapshot.members.userId': userId } // User is a member (for workstreams)
      ]
    };
    
    if (domainId) {
      query.domainId = domainId;
    }

    return await TaskExecution.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Get task execution by domain task ID and user
   */
  static async getTaskExecutionByDomainTask(
    domainTaskId: string,
    userId: string
  ): Promise<ITaskExecution | null> {
    return await TaskExecution.findOne({ 
      domainTaskId, 
      userId,
      status: { $in: ['assigned', 'in_progress'] }
    })
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