import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import Conversation from '@/app/models/Conversation';
import UserPost from '@/app/models/UserPost';
import Post from '@/app/models/Post';
import Process from '@/app/models/Process';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    conversationId: string;
  };
}

/**
 * GET /api/conversations/[conversationId]/info
 * Get comprehensive information about a conversation including userPost and process details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const userId = decoded.id;

    const { conversationId } = context.params;

    // Get the conversation
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify the conversation belongs to the user
    if (conversation.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare response object
    const response: any = {
      conversation: {
        conversationId: conversation.conversationId,
        title: conversation.title,
        processId: conversation.processId,
        processName: conversation.processName,
        executionModel: conversation.executionModel,
        domainId: conversation.domainId,
        userPostId: conversation.userPostId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }
    };

    // Get UserPost information if available
    if (conversation.userPostId) {
      const userPost = await UserPost.findById(conversation.userPostId).populate('postId');
      if (userPost) {
        const post = await Post.findById(userPost.postId);
        response.userPost = {
          id: userPost._id.toString(),
          postId: userPost.postId,
          userId: userPost.userId,
          isCompleted: userPost.isCompleted,
          isViewed: userPost.isViewed,
          isHidden: userPost.isHidden,
          processId: userPost.processId,
          masterPost: post ? {
            title: post.title,
            description: post.description,
            postType: post.postType,
            ctaLabel: post.ctaLabel,
            domain: post.domain,
          } : null,
        };
      }
    }

    // Get Process information if available
    if (conversation.processId) {
      const process = await Process.findOne({ processId: conversation.processId });
      if (process) {
        response.process = {
          processId: process.processId,
          name: process.name,
          description: process.description,
          category: process.category,
          executionModel: process.executionModel,
          currentStage: process.currentStage,
          aiAgentAttached: process.aiAgentAttached,
          aiAgentRole: process.aiAgentRole,
          checklist: process.checklist || [],
          intro: process.intro, // Include intro message
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching conversation info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation information' },
      { status: 500 }
    );
  }
}