import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import DomainTask from '@/app/models/DomainTask';
import TaskExecution from '@/app/models/TaskExecution';
import User from '@/app/models/User';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let domainTaskId: string | undefined;
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

    // Get domain task ID from request body
    const body = await request.json();
    domainTaskId = body.taskId;

    if (!domainTaskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get the domain task with its complete snapshot
    const domainTask = await DomainTask.findById(domainTaskId);
    if (!domainTask) {
      return NextResponse.json({ error: 'Domain task not found' }, { status: 404 });
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

    // Check if user already has an active execution for this task
    const existingExecution = await TaskExecution.findOne({
      userId,
      domainTaskId,
      status: { $in: ['assigned', 'in_progress'] }
    });

    if (existingExecution) {
      return NextResponse.json({ 
        error: 'You already have an active execution for this task',
        executionId: existingExecution.executionId
      }, { status: 400 });
    }

    // Create task execution (combining UserTask + TaskExecution)
    const executionId = uuidv4();
    const taskExecution = new TaskExecution({
      executionId,
      userId,
      domainId: domainTask.domain,
      domainTaskId,
      
      // Complete task snapshot from DomainTask
      taskSnapshot: {
        title: domainTask.masterTaskSnapshot.title,
        description: domainTask.masterTaskSnapshot.description,
        taskType: domainTask.masterTaskSnapshot.taskType,
        executionModel: domainTask.masterTaskSnapshot.executionModel,
        aiAgentRole: domainTask.masterTaskSnapshot.aiAgentRole,
        systemPrompt: domainTask.customizations?.systemPrompt || domainTask.masterTaskSnapshot.systemPrompt,
        customInstructions: domainTask.customizations?.customInstructions || domainTask.masterTaskSnapshot.customInstructions,
        sop: domainTask.masterTaskSnapshot.sop,
        procedures: domainTask.masterTaskSnapshot.procedures,
        checklist: domainTask.masterTaskSnapshot.checklist,
        requiredParameters: domainTask.masterTaskSnapshot.requiredParameters,
        formSchema: domainTask.masterTaskSnapshot.formSchema,
        reward: domainTask.customizations?.reward || domainTask.masterTaskSnapshot.reward,
        estimatedDuration: domainTask.masterTaskSnapshot.estimatedDuration,
        difficultyLevel: domainTask.masterTaskSnapshot.difficultyLevel,
        introductionMessage: domainTask.customizations?.introductionMessage || domainTask.masterTaskSnapshot.introductionMessage
      },
      
      // Initial state
      status: 'assigned',
      assignedAt: new Date(),
      messages: []
    });

    await taskExecution.save();

    console.log(`Task ${domainTaskId} assigned to user ${userId} with execution ${executionId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Task assigned successfully',
      executionId: taskExecution.executionId
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      domainTaskId,
      userId
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to assign task',
        details: error instanceof Error ? error.message : 'Unknown error',
        domainTaskId,
        userId
      },
      { status: 500 }
    );
  }
}