import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import { TaskJourneyService } from '@/app/lib/services/task-journey.service';
import DomainTask from '@/app/models/DomainTask';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let taskId: string | undefined;
  let userId: string | undefined;
  
  try {
    await connectToDatabase();
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded.id;
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get task ID from request body
    const body = await request.json();
    taskId = body.taskId;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Verify the task exists and get its domain
    const domainTask = await DomainTask.findById(taskId).select('domain');
    if (!domainTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access to this domain
    const user = await User.findById(userId).select('domains');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasDomainAccess = user.domains?.some(
      (domain: any) => domain.domain.toString() === domainTask.domain.toString()
    );

    if (!hasDomainAccess) {
      console.log('User does not have access to domain:', domainTask.domain);
      return NextResponse.json({ 
        error: 'Access denied. You are not a member of this domain.' 
      }, { status: 403 });
    }

    // Assign the task to the user (self-assignment)
    const result = await TaskJourneyService.assignTask({
      userId,
      taskId,
      reason: 'user_initiated',
      assignedBy: userId  // Self-assignment: assignedBy is the same as userId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to assign task' },
        { status: 400 }
      );
    }

    console.log(`Task ${taskId} assigned to user ${userId}`);
    
    // Type assertion since we know the service returns userTask on success
    const successResult = result as { success: true; userTask?: any; userTaskId?: string };
    
    if (!successResult.userTaskId) {
      return NextResponse.json(
        { error: 'Task assignment succeeded but userTaskId not returned' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Task assigned successfully',
      userTaskId: successResult.userTaskId
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      taskId,
      userId
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to assign task',
        details: error instanceof Error ? error.message : 'Unknown error',
        taskId,
        userId
      },
      { status: 500 }
    );
  }
}