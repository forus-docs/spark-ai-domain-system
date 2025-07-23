import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import { PostJourneyService } from '@/app/lib/services/post-journey.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let userId: string;
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded.id;
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get post ID from request body
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Assign the post to the user
    const result = await PostJourneyService.assignPost({
      userId,
      postId,
      reason: 'user_initiated',
      assignedBy: 'user'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to assign post' },
        { status: 400 }
      );
    }

    console.log(`Post ${postId} assigned to user ${userId}`);
    return NextResponse.json({ success: true, message: 'Post assigned successfully' });
  } catch (error) {
    console.error('Error assigning post:', error);
    return NextResponse.json(
      { error: 'Failed to assign post' },
      { status: 500 }
    );
  }
}