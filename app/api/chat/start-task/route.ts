import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import UserTask from '@/app/models/UserTask';
import { TaskExecutionService, ExecutionMessageService } from '@/app/services/task-executions';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/start-task
 * Simplified endpoint for onboarding tasks - always creates new execution
 */
export async function POST(request: NextRequest) {
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

    const { userTaskId } = await request.json();

    if (!userTaskId) {
      return NextResponse.json({ error: 'userTaskId is required' }, { status: 400 });
    }

    // Get the UserTask with its complete snapshot
    const userTask = await UserTask.findById(userTaskId);
    
    if (!userTask || userTask.userId !== userId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task has execution data
    const executionData = userTask.taskSnapshot?.executionData;
    if (!executionData) {
      return NextResponse.json({ 
        error: 'This task is not configured for chat execution' 
      }, { status: 400 });
    }

    // Build system prompt from snapshot
    let systemPrompt = executionData.systemPrompt || 
      `You are an AI assistant helping with the ${userTask.taskSnapshot.title} task.`;

    // Create new task execution (for onboarding, always create new)
    const taskExecution = await TaskExecutionService.createTaskExecution({
      userId,
      title: userTask.taskSnapshot.title,
      domainTaskId: userTask.domainTaskId,
      executionModel: executionData.executionModel,
      userTaskId: userTask._id.toString(),
      model: 'gemini-1.5-flash',
      systemPrompt: systemPrompt,
    });

    // Create intro message if available
    let introMessage = null;
    if (executionData.intro) {
      const message = await ExecutionMessageService.createMessage({
        executionId: taskExecution.executionId,
        userId: userId,
        role: 'assistant',
        content: executionData.intro,
      });
      introMessage = executionData.intro;
    }

    // Return everything needed to start the chat
    return NextResponse.json({
      executionId: taskExecution.executionId,
      title: userTask.taskSnapshot.title,
      executionModel: executionData.executionModel,
      aiAgentRole: executionData.aiAgentRole,
      introMessage,
      // Include any other useful data for the chat interface
      taskDetails: {
        description: userTask.taskSnapshot.description,
        estimatedTime: userTask.taskSnapshot.estimatedTime,
        category: userTask.taskSnapshot.category,
      }
    });
  } catch (error) {
    console.error('Error starting task:', error);
    return NextResponse.json(
      { error: 'Failed to start task' },
      { status: 500 }
    );
  }
}