import Conversation, { IConversation } from '@/app/models/Conversation';
import Message, { IMessage } from '@/app/models/Message';
import { v4 as uuidv4 } from 'uuid';

export interface CreateConversationParams {
  userId: string;
  title?: string;
  domainId?: string;
  processId?: string;
  processName?: string;
  executionModel?: string;
  userPostId?: string; // Reference to UserPost that initiated this conversation
  model?: string;
  systemPrompt?: string;
}

export interface CreateMessageParams {
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parentMessageId?: string;
  model?: string;
  tokenCount?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export class ConversationService {
  /**
   * Create a new conversation
   */
  static async createConversation(params: CreateConversationParams): Promise<IConversation> {
    const conversationId = uuidv4();
    
    const conversation = new Conversation({
      conversationId,
      userId: params.userId,
      title: params.title || 'New Chat',
      domainId: params.domainId,
      processId: params.processId,
      processName: params.processName,
      executionModel: params.executionModel,
      userPostId: params.userPostId, // Link to UserPost
      aiModel: params.model || 'gemini-1.5-flash',
      systemPrompt: params.systemPrompt, // Store the full context
      messages: [],
    });

    return await conversation.save();
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(conversationId: string): Promise<IConversation | null> {
    return await Conversation.findOne({ conversationId })
      .populate('messages')
      .exec();
  }

  /**
   * Get user's conversations
   */
  static async getUserConversations(
    userId: string,
    domainId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<IConversation[]> {
    const query: any = { userId };
    if (domainId) {
      query.domainId = domainId;
    }

    return await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Get conversations for a UserPost
   */
  static async getUserPostConversations(
    userPostId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<IConversation[]> {
    return await Conversation.find({ userPostId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<IConversation | null> {
    return await Conversation.findOneAndUpdate(
      { conversationId },
      { title },
      { new: true }
    ).exec();
  }

  /**
   * Delete conversation and its messages
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    // Delete all messages first
    await Message.deleteMany({ conversationId });
    
    // Delete the conversation
    const result = await Conversation.deleteOne({ conversationId });
    
    return result.deletedCount > 0;
  }
}

export class MessageService {
  /**
   * Create a new message
   */
  static async createMessage(params: CreateMessageParams): Promise<IMessage> {
    const messageId = uuidv4();
    
    const message = new Message({
      messageId,
      conversationId: params.conversationId,
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

    // Add message to conversation
    await Conversation.findOneAndUpdate(
      { conversationId: params.conversationId },
      { $push: { messages: savedMessage._id } }
    );

    return savedMessage;
  }

  /**
   * Get messages for a conversation
   */
  static async getConversationMessages(
    conversationId: string,
    limit?: number
  ): Promise<IMessage[]> {
    const query = Message.find({ conversationId })
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
  ): Promise<IMessage | null> {
    return await Message.findOneAndUpdate(
      { messageId },
      { feedback },
      { new: true }
    ).exec();
  }

  /**
   * Get message by ID
   */
  static async getMessage(messageId: string): Promise<IMessage | null> {
    return await Message.findOne({ messageId }).exec();
  }

  /**
   * Update message content (for edits)
   */
  static async updateMessageContent(
    messageId: string,
    content: string
  ): Promise<IMessage | null> {
    return await Message.findOneAndUpdate(
      { messageId },
      { content, text: content },
      { new: true }
    ).exec();
  }
}