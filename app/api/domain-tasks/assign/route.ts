import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import { TaskJourneyService } from '@/app/lib/services/task-journey.service';

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

    // Get task ID from request body
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Assign the task to the user
    const result = await TaskJourneyService.assignTask({
      userId,
      taskId,
      reason: 'user_initiated',
      assignedBy: 'user'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to assign task' },
        { status: 400 }
      );
    }

    console.log(`Task ${taskId} assigned to user ${userId}`);
    return NextResponse.json({ success: true, message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Error assigning task:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}