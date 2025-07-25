import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import TaskExecution from '@/app/models/TaskExecution';
import UserPost from '@/app/models/UserTask';
import Post from '@/app/models/DomainTask';
import MasterTask from '@/app/models/MasterTask';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    executionId: string;
  };
}

/**
 * GET /api/task-executions/[executionId]/info
 * Get comprehensive information about a task execution including userTask and masterTask details
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

    // Get the task execution
    const taskExecution = await TaskExecution.findOne({ executionId });
    if (!taskExecution) {
      return NextResponse.json({ error: 'Task execution not found' }, { status: 404 });
    }

    // Verify the task execution belongs to the user
    if (taskExecution.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare response object
    const response: any = {
      taskExecution: {
        executionId: taskExecution.executionId,
        title: taskExecution.title,
        masterTaskId: taskExecution.masterTaskId,
        masterTaskName: taskExecution.masterTaskName,
        executionModel: taskExecution.executionModel,
        domainId: taskExecution.domainId,
        userTaskId: taskExecution.userTaskId,
        createdAt: taskExecution.createdAt,
        updatedAt: taskExecution.updatedAt,
      }
    };

    // Get UserTask information if available
    if (taskExecution.userTaskId) {
      const userTask = await UserPost.findById(taskExecution.userTaskId).populate('domainTaskId');
      if (userTask) {
        const domainTask = await Post.findById(userTask.domainTaskId);
        response.userTask = {
          id: userTask._id.toString(),
          domainTaskId: userTask.domainTaskId,
          userId: userTask.userId,
          isCompleted: userTask.isCompleted,
          isViewed: userTask.isViewed,
          isHidden: userTask.isHidden,
          masterTaskId: userTask.masterTaskId,
          domainTask: domainTask ? {
            title: domainTask.title,
            description: domainTask.description,
            taskType: domainTask.taskType,
            ctaText: domainTask.ctaText,
            domain: domainTask.domain,
          } : null,
        };
      }
    }

    // Get MasterTask information if available
    if (taskExecution.masterTaskId) {
      const masterTask = await MasterTask.findOne({ 
        $or: [
          { masterTaskId: taskExecution.masterTaskId },
          { _id: taskExecution.masterTaskId }
        ]
      });
      if (masterTask) {
        response.masterTask = {
          masterTaskId: masterTask.masterTaskId || masterTask._id.toString(),
          name: masterTask.name,
          description: masterTask.description,
          category: masterTask.category,
          executionModel: masterTask.executionModel,
          currentStage: masterTask.currentStage,
          aiAgentAttached: masterTask.aiAgentAttached,
          aiAgentRole: masterTask.aiAgentRole,
          checklist: masterTask.checklist || [],
          intro: masterTask.intro, // Include intro message
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching task execution info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task execution information' },
      { status: 500 }
    );
  }
}