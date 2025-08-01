import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { connectToDatabase } from '@/app/lib/database';
import DomainTask from '@/app/models/DomainTask';
import TaskExecution from '@/app/models/TaskExecution';
import ExecutionMessage from '@/app/models/ExecutionMessage';
import User from '@/app/models/User';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let domainTaskId: string | undefined;
  let userId: string | undefined;
  
  try {
    await connectToDatabase();
    
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    userId = session.user.id;

    // Get domain task ID from request body
    const body = await request.json();
    domainTaskId = body.taskId;
    
    console.log('Assign task request - domainTaskId:', domainTaskId);
    console.log('domainTaskId type:', typeof domainTaskId);

    if (!domainTaskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get the domain task with its complete snapshot
    const domainTask = await DomainTask.findById(domainTaskId);
    console.log('Domain task found:', !!domainTask);
    
    if (!domainTask) {
      console.log('Domain task not found for ID:', domainTaskId);
      return NextResponse.json({ error: 'Domain task not found' }, { status: 404 });
    }

    // Verify user has access to this domain
    const user = await User.findById(userId).select('domains');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasDomainAccess = user.domains?.some(
      (domain: any) => domain.domainId === domainTask.domain
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
    
    // Convert domainTask to plain object to avoid Mongoose document issues
    const domainTaskObj = domainTask.toObject();
    
    const taskExecution = new TaskExecution({
      executionId,
      userId: new mongoose.Types.ObjectId(userId),
      domainId: new mongoose.Types.ObjectId(domainTask.domain), // Convert string to ObjectId
      domainTaskId: domainTask._id, // Already an ObjectId
      
      // Complete task snapshot from DomainTask - store as-is for QMS compliance
      taskSnapshot: domainTaskObj,
      
      // Initial state
      status: 'assigned',
      assignedAt: new Date(),
      messages: []
    });

    try {
      await taskExecution.save();
    } catch (saveError: any) {
      console.error('TaskExecution save error:', saveError);
      console.error('Validation errors:', saveError.errors);
      if (saveError.errors) {
        Object.keys(saveError.errors).forEach(key => {
          console.error(`Field ${key}:`, saveError.errors[key].message);
        });
      }
      throw saveError;
    }

    // Create intro message if task has one
    if (domainTaskObj.intro || domainTaskObj.introductionMessage) {
      const introContent = domainTaskObj.intro || domainTaskObj.introductionMessage;
      const introMessage = new ExecutionMessage({
        messageId: uuidv4(),
        executionId: executionId,
        role: 'system',
        content: introContent,
        text: introContent,
        userId: userId,
        isCreatedByUser: false
      });
      
      await introMessage.save();
      
      // Add the message to the task execution
      taskExecution.messages.push(introMessage._id);
      await taskExecution.save();
    }

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