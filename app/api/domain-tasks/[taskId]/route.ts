import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { TaskJourneyService } from '@/app/lib/services/task-journey.service';
import { connectToDatabase } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

// Mark post as viewed
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header (case-insensitive)
    // Get session from NextAuth
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;

    // Mark as viewed
    await TaskJourneyService.markTaskViewed(userId, params.taskId);

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
  { params }: { params: { taskId: string } }
) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header (case-insensitive)
    // Get session from NextAuth
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;

    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'complete':
        result = await TaskJourneyService.completeTask({
          userId,
          userTaskId: params.taskId,
          completionData: body.completionData
        });
        break;
      
      case 'toggleVisibility':
        result = await TaskJourneyService.toggleTaskVisibility(userId, params.taskId);
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