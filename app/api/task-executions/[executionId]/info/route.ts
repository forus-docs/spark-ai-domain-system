import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import TaskExecution from '@/app/models/TaskExecution';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    executionId: string;
  };
}

/**
 * GET /api/task-executions/[executionId]/info
 * Get comprehensive information about a task execution
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

    const { executionId } = context.params;

    // Get the task execution with full task snapshot
    const taskExecution = await TaskExecution.findOne({ executionId });
    if (!taskExecution) {
      return NextResponse.json({ error: 'Task execution not found' }, { status: 404 });
    }

    // Verify the task execution belongs to the user
    if (taskExecution.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Return comprehensive task execution info
    return NextResponse.json({
      taskExecution: {
        executionId: taskExecution.executionId,
        status: taskExecution.status,
        assignedAt: taskExecution.assignedAt,
        startedAt: taskExecution.startedAt,
        completedAt: taskExecution.completedAt,
        domainId: taskExecution.domainId,
        domainTaskId: taskExecution.domainTaskId,
        procedureStates: taskExecution.procedureStates,
        formData: taskExecution.formData,
        createdAt: taskExecution.createdAt,
        updatedAt: taskExecution.updatedAt,
      },
      task: taskExecution.taskSnapshot, // Complete task data
      messageCount: taskExecution.messages.length
    });
  } catch (error) {
    console.error('Error fetching task execution info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task execution info' },
      { status: 500 }
    );
  }
}