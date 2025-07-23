import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { ConversationService, MessageService } from '@/app/services/conversations';
import { connectToDatabase } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const conversations = await ConversationService.getUserConversations(
      userId,
      domainId || undefined,
      limit,
      offset
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectToDatabase();

  const isDevelopment = process.env.NODE_ENV === 'development';
  let userId = 'anonymous';

  if (!isDevelopment) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      userId = decoded.id; // JWT payload has 'id' field
    } catch (error) {
      return new Response('Invalid token', { status: 401 });
    }
  }

  const { conversationId } = await request.json();

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId is required' },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const conversation = await ConversationService.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const deleted = await ConversationService.deleteConversation(conversationId);
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}