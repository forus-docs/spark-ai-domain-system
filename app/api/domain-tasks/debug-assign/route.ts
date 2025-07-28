import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import DomainTask from '@/app/models/DomainTask';
import TaskExecution from '@/app/models/TaskExecution';
import User from '@/app/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const debugInfo: any = {
    step: 'start',
    errors: [],
    data: {}
  };
  
  try {
    await connectToDatabase();
    debugInfo.step = 'connected';
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: debugInfo 
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded.id;
      debugInfo.data.userId = userId;
      debugInfo.step = 'token_verified';
    } catch (error) {
      debugInfo.errors.push({
        step: 'token_verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return NextResponse.json({ 
        error: 'Invalid token',
        debug: debugInfo 
      }, { status: 401 });
    }

    // Get domain task ID from request body
    const body = await request.json();
    const domainTaskId = body.taskId;
    debugInfo.data.domainTaskId = domainTaskId;
    debugInfo.data.domainTaskIdType = typeof domainTaskId;
    
    if (!domainTaskId) {
      return NextResponse.json({ 
        error: 'Task ID is required',
        debug: debugInfo 
      }, { status: 400 });
    }

    debugInfo.step = 'finding_domain_task';
    
    // Get the domain task with its complete snapshot
    const domainTask = await DomainTask.findById(domainTaskId);
    debugInfo.data.domainTaskFound = !!domainTask;
    
    if (!domainTask) {
      return NextResponse.json({ 
        error: 'Domain task not found',
        debug: debugInfo 
      }, { status: 404 });
    }

    // Log domain task structure
    debugInfo.data.domainTaskStructure = {
      hasTitle: !!domainTask.title,
      hasDescription: !!domainTask.description,
      hasTaskType: !!domainTask.taskType,
      hasExecutionModel: !!domainTask.executionModel,
      hasSOP: !!domainTask.standardOperatingProcedure,
      hasChecklist: !!domainTask.checklist,
      checklistLength: domainTask.checklist?.length || 0,
      hasReward: !!domainTask.reward,
      domain: domainTask.domain,
      domainType: typeof domainTask.domain
    };

    debugInfo.step = 'checking_user_access';
    
    // Verify user has access to this domain
    const user = await User.findById(userId).select('domains');
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        debug: debugInfo 
      }, { status: 404 });
    }

    try {
      debugInfo.data.userDomains = user.domains?.map((d: any) => ({
        domain: d.domain?.toString() || 'null',
        role: d.role?.toString() || 'null',
        raw: JSON.stringify(d)
      }));
    } catch (mapError) {
      debugInfo.errors.push({
        step: 'mapping_user_domains',
        error: mapError instanceof Error ? mapError.message : 'Unknown error',
        userDomainsRaw: JSON.stringify(user.domains)
      });
    }

    let hasDomainAccess = false;
    try {
      hasDomainAccess = user.domains?.some(
        (domain: any) => domain.domainId === domainTask.domain
      ) || false;
    } catch (accessError) {
      debugInfo.errors.push({
        step: 'checking_domain_access',
        error: accessError instanceof Error ? accessError.message : 'Unknown error'
      });
    }
    debugInfo.data.hasDomainAccess = hasDomainAccess;

    if (!hasDomainAccess) {
      return NextResponse.json({ 
        error: 'Access denied. You are not a member of this domain.',
        debug: debugInfo 
      }, { status: 403 });
    }

    debugInfo.step = 'creating_task_execution';
    
    // Try to create the task execution object
    try {
      const taskExecutionData = {
        executionId: 'test-execution-id',
        userId: new mongoose.Types.ObjectId(userId),
        domainId: new mongoose.Types.ObjectId(domainTask.domain),
        domainTaskId: domainTask._id,
        taskSnapshot: {
          title: domainTask.title || 'Untitled',
          description: domainTask.description || '',
          taskType: domainTask.taskType || 'task',
          executionModel: domainTask.executionModel || 'form',
          aiAgentRole: domainTask.aiAgentRole || '',
          systemPrompt: domainTask.systemPrompt || '',
          customInstructions: domainTask.intro || '',
          sop: domainTask.standardOperatingProcedure || null,
          procedures: domainTask.standardOperatingProcedure?.procedures || [],
          checklist: domainTask.checklist?.map((item: any) => item.title) || [],
          requiredParameters: domainTask.requiredParameters || [],
          formSchema: domainTask.formSchema || null,
          reward: domainTask.reward ? {
            amount: domainTask.reward.amount || 0,
            currency: domainTask.reward.currency || '',
            displayText: domainTask.reward.displayText || ''
          } : null,
          estimatedDuration: domainTask.estimatedTime || '',
          difficultyLevel: domainTask.priority || 'normal',
          introductionMessage: domainTask.intro || ''
        },
        status: 'assigned',
        assignedAt: new Date(),
        messages: []
      };
      
      debugInfo.data.taskExecutionData = {
        hasAllRequiredFields: true,
        snapshot: {
          title: taskExecutionData.taskSnapshot.title,
          taskType: taskExecutionData.taskSnapshot.taskType,
          executionModel: taskExecutionData.taskSnapshot.executionModel,
          proceduresCount: taskExecutionData.taskSnapshot.procedures.length,
          checklistCount: taskExecutionData.taskSnapshot.checklist.length
        }
      };
      
      // Try to validate without saving
      const taskExecution = new TaskExecution(taskExecutionData);
      const validationError = taskExecution.validateSync();
      
      if (validationError) {
        debugInfo.errors.push({
          step: 'validation',
          error: validationError.message,
          errors: Object.keys(validationError.errors || {}).map(key => ({
            field: key,
            message: validationError.errors[key].message
          }))
        });
      }
      
      debugInfo.step = 'validation_complete';
      
    } catch (error) {
      debugInfo.errors.push({
        step: 'task_execution_creation',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    return NextResponse.json({ 
      success: false,
      message: 'Debug endpoint - no actual assignment performed',
      debug: debugInfo 
    });
    
  } catch (error) {
    debugInfo.errors.push({
      step: debugInfo.step,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Debug process failed',
      debug: debugInfo 
    }, { status: 500 });
  }
}