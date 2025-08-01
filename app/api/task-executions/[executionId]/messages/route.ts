import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { TaskExecutionService, ExecutionMessageService } from '@/app/services/task-executions';
import { connectToDatabase } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  await connectToDatabase();

  // Get session from NextAuth
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;

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