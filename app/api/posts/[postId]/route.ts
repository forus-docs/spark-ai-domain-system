import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { PostJourneyService } from '@/app/lib/services/post-journey.service';
import { connectToDatabase } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

// Mark post as viewed
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header (case-insensitive)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const userId = decoded.id;

    // Mark as viewed
    await PostJourneyService.markPostViewed(userId, params.postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking post as viewed:', error);
    return NextResponse.json(
      { error: 'Failed to mark post as viewed' },
      { status: 500 }
    );
  }
}

// Update post (complete or toggle visibility)
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header (case-insensitive)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const userId = decoded.id;

    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'complete':
        result = await PostJourneyService.completePost({
          userId,
          userPostId: params.postId,
          completionData: body.completionData
        });
        break;
      
      case 'toggleVisibility':
        result = await PostJourneyService.togglePostVisibility(userId, params.postId);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}