import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { ConversationService } from '@/app/services/conversations';
import { connectToDatabase } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  let userId = 'anonymous'; // Default fallback
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      userId = decoded.id; // JWT payload has 'id' field
    } catch (error) {
      console.error('Invalid auth token:', error);
      // In development, allow fallback to anonymous
      // In production, this would be a hard failure
      if (process.env.NODE_ENV !== 'development') {
        return new Response('Invalid token', { status: 401 });
      }
    }
  } else if (process.env.NODE_ENV !== 'development') {
    // Require auth in production
    return new Response('Unauthorized', { status: 401 });
  }

  const { conversationId } = params;

  try {
    // Get conversation
    const conversation = await ConversationService.getConversation(conversationId);
    
    if (!conversation || conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}