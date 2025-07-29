import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { TaskExecutionService, ExecutionMessageService } from '@/app/services/task-executions';
import { connectToDatabase } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
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

  const { executionId } = params;

  try {
    // Verify ownership or membership
    const taskExecution = await TaskExecutionService.getTaskExecution(executionId);
    if (!taskExecution) {
      return NextResponse.json(
        { error: 'Task execution not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this task execution
    const isOwner = taskExecution.userId.toString() === userId;
    const isMember = taskExecution.taskSnapshot?.taskType === 'workstream_basic' && 
      taskExecution.taskSnapshot?.members?.some((m: any) => m.userId === userId);

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'Task execution not found' },
        { status: 404 }
      );
    }

    const messages = await ExecutionMessageService.getExecutionMessages(executionId);

    return NextResponse.json({ 
      messages,
      taskExecution: {
        executionId: taskExecution.executionId,
        title: taskExecution.taskSnapshot?.title || 'Task',
        domainTaskId: taskExecution.domainTaskId,
        executionModel: taskExecution.taskSnapshot?.executionModel,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}