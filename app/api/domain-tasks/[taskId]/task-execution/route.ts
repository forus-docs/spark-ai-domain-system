import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import UserTask from '@/app/models/UserTask';
import DomainTask from '@/app/models/DomainTask';
import User from '@/app/models/User';
import { TaskExecutionService, ExecutionMessageService } from '@/app/services/task-executions';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    taskId: string;
  };
}

/**
 * POST /api/domain-tasks/[taskId]/task-execution
 * QMS-COMPLIANT: Creates task execution using ONLY UserTask snapshot data
 * No dynamic fetching from MasterTask or DomainTask collections
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

    const { taskId } = context.params;

    console.log('Creating task execution for userTask:', taskId);
    console.log('User ID:', userId);

    // Get the UserTask with its complete snapshot
    const userTask = await UserTask.findById(taskId);
    console.log('UserTask found:', !!userTask);
    console.log('UserTask is QMS compliant:', userTask?.isQMSCompliant);
    
    if (!userTask || userTask.userId !== userId) {
      console.log('UserTask not found or wrong user');
      return NextResponse.json({ error: 'UserTask not found' }, { status: 404 });
    }

    // Verify domain access
    const user = await User.findById(userId).select('domains');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the domain from the UserTask's domainTaskId
    const domainTask = await DomainTask.findById(userTask.domainTaskId).select('domain');
    if (!domainTask) {
      console.error('DomainTask not found for UserTask:', userTask.domainTaskId);
      return NextResponse.json({ error: 'Domain task not found' }, { status: 404 });
    }

    // Check if user has access to this domain
    const hasDomainAccess = user.domains?.some(
      (domain: any) => domain.domain.toString() === domainTask.domain.toString()
    );

    if (!hasDomainAccess) {
      console.log('User does not have access to domain:', domainTask.domain);
      return NextResponse.json({ 
        error: 'Access denied. You are not a member of this domain.' 
      }, { status: 403 });
    }

    // QMS COMPLIANCE CHECK: Ensure UserTask has execution data
    const executionData = userTask.taskSnapshot?.executionData;
    if (!executionData) {
      console.log('UserTask does not have execution data - not QMS compliant');
      return NextResponse.json({ 
        error: 'This task is not configured for execution. Please contact support.' 
      }, { status: 400 });
    }

    // Check if task is AI-assisted
    if (!executionData.aiAgentAttached) {
      return NextResponse.json({ error: 'This task is not AI-assisted' }, { status: 400 });
    }

    // Check for existing task executions for this UserTask
    const existingExecutions = await TaskExecutionService.getTaskExecutionsByUserTask(
      userTask._id.toString()
    );

    let taskExecution;

    if (existingExecutions.length > 0) {
      // Return the most recent task execution
      taskExecution = existingExecutions[0];
      console.log(`Found existing task execution: ${taskExecution.executionId}`);
    } else {
      // Build system prompt ONLY from UserTask snapshot data
      let systemPrompt = executionData.systemPrompt || 
        `You are an AI assistant helping with the ${userTask.taskSnapshot.title} task.`;
      
      // Add SOP from snapshot if available
      if (executionData.standardOperatingProcedure) {
        const sop = executionData.standardOperatingProcedure;
        
        systemPrompt += `\n\n## STANDARD OPERATING PROCEDURE (SOP)`;
        
        // Add objective and scope
        systemPrompt += `\n\n### Objective\n${sop.objective}`;
        
        if (sop.scope) {
          systemPrompt += `\n\n### Scope`;
          if (sop.scope.included && sop.scope.included.length > 0) {
            systemPrompt += `\n\n**Included:**`;
            sop.scope.included.forEach((item: string) => {
              systemPrompt += `\n- ${item}`;
            });
          }
          if (sop.scope.excluded && sop.scope.excluded.length > 0) {
            systemPrompt += `\n\n**Excluded:**`;
            sop.scope.excluded.forEach((item: string) => {
              systemPrompt += `\n- ${item}`;
            });
          }
          if (sop.scope.applicableTo && sop.scope.applicableTo.length > 0) {
            systemPrompt += `\n\n**Applicable To:**`;
            sop.scope.applicableTo.forEach((item: string) => {
              systemPrompt += `\n- ${item}`;
            });
          }
        }
        
        // Add policies and compliance
        if (sop.policies) {
          systemPrompt += `\n\n### Policies & Compliance`;
          if (sop.policies.compliance && sop.policies.compliance.length > 0) {
            systemPrompt += `\n\n**Compliance Standards:** ${sop.policies.compliance.join(', ')}`;
          }
          if (sop.policies.standards && sop.policies.standards.length > 0) {
            systemPrompt += `\n**Standards:** ${sop.policies.standards.join(', ')}`;
          }
          if (sop.policies.regulations && sop.policies.regulations.length > 0) {
            systemPrompt += `\n**Regulations:** ${sop.policies.regulations.join(', ')}`;
          }
        }
        
        // Add roles and responsibilities
        if (sop.rolesAndResponsibilities && sop.rolesAndResponsibilities.length > 0) {
          systemPrompt += `\n\n### Roles & Responsibilities`;
          sop.rolesAndResponsibilities.forEach((role: any) => {
            systemPrompt += `\n\n**${role.role}:**`;
            if (role.responsibilities && role.responsibilities.length > 0) {
              role.responsibilities.forEach((resp: string) => {
                systemPrompt += `\n- ${resp}`;
              });
            }
          });
        }
        
        // Add detailed procedures
        if (sop.procedures && sop.procedures.length > 0) {
          systemPrompt += `\n\n### Procedures`;
          sop.procedures.forEach((proc: any) => {
            systemPrompt += `\n\n**Step ${proc.stepNumber}: ${proc.name}**`;
            systemPrompt += `\n- Description: ${proc.description}`;
            systemPrompt += `\n- Responsible: ${proc.responsible}`;
            systemPrompt += `\n- Duration: ${proc.duration}`;
            
            if (proc.decisionPoints && proc.decisionPoints.length > 0) {
              systemPrompt += `\n- Decision Points:`;
              proc.decisionPoints.forEach((dp: any) => {
                systemPrompt += `\n  - If ${dp.condition}: ${dp.truePath} / Else: ${dp.falsePath}`;
              });
            }
          });
        }
        
        // Add SOP metadata for context
        if (executionData.sopMetadata) {
          systemPrompt += `\n\n### Additional Context`;
          if (executionData.sopMetadata.complianceStandards) {
            systemPrompt += `\n- Compliance: ${executionData.sopMetadata.complianceStandards.join(', ')}`;
          }
          if (executionData.sopMetadata.riskLevel) {
            systemPrompt += `\n- Risk Level: ${executionData.sopMetadata.riskLevel}`;
          }
          if (executionData.sopMetadata.estimatedDuration) {
            systemPrompt += `\n- Estimated Duration: ${executionData.sopMetadata.estimatedDuration}`;
          }
        }
      } else if (executionData.checklist && executionData.checklist.length > 0) {
        // Use checklist from snapshot if no SOP
        systemPrompt += '\n\nTask Checklist:';
        executionData.checklist.forEach((item: any) => {
          systemPrompt += `\n${item.step}. ${item.title} - ${item.description}`;
          if (item.subSteps) {
            item.subSteps.forEach((subStep: any) => {
              systemPrompt += `\n  ${subStep.step}. ${subStep.title}`;
            });
          }
        });
      }
      
      // Add required parameters from snapshot
      if (executionData.requiredParameters && executionData.requiredParameters.length > 0) {
        systemPrompt += `\n\n### Required Information`;
        systemPrompt += `\nYou must collect the following information:`;
        executionData.requiredParameters.forEach((param: any) => {
          systemPrompt += `\n- ${param.displayName} (${param.name}): ${param.description}`;
          if (param.validation) {
            if (param.validation.required) {
              systemPrompt += ` [REQUIRED]`;
            }
            if (param.validation.minLength || param.validation.maxLength) {
              systemPrompt += ` [Length: ${param.validation.minLength || 0}-${param.validation.maxLength || 'unlimited'}]`;
            }
          }
        });
      }
      
      // Add intro message from snapshot
      if (executionData.intro) {
        systemPrompt += `\n\n### Introduction Message for Users\n${executionData.intro}`;
      }

      // Add task context from snapshot
      systemPrompt += `\n\n### Current Task Context
- Title: ${userTask.taskSnapshot.title}
- Description: ${userTask.taskSnapshot.description}
- Type: ${userTask.taskSnapshot.taskType}
- Priority: ${userTask.taskSnapshot.priority || 'normal'}`;

      // Apply any domain customizations
      if (userTask.taskSnapshot.domainCustomizations?.additionalContext) {
        systemPrompt += `\n\n### Domain-Specific Context\n${userTask.taskSnapshot.domainCustomizations.additionalContext}`;
      }

      // Create task execution using ONLY snapshot data
      taskExecution = await TaskExecutionService.createTaskExecution({
        userId,
        title: userTask.taskSnapshot.title,
        domainTaskId: userTask.domainTaskId, // Reference to domain task for tracking
        executionModel: executionData.executionModel,
        userTaskId: userTask._id.toString(),
        model: 'gemini-1.5-flash', // Default model
        systemPrompt: systemPrompt,
      });
      console.log(`Created new task execution: ${taskExecution.executionId}`);
      
      // Create intro message as the first message if available
      if (executionData.intro) {
        await ExecutionMessageService.createMessage({
          executionId: taskExecution.executionId,
          userId: userId,
          role: 'assistant',
          content: executionData.intro,
        });
      }
    }

    // Return task execution info (all from snapshot)
    return NextResponse.json({
      executionId: taskExecution.executionId,
      isNew: existingExecutions.length === 0,
      task: {
        title: userTask.taskSnapshot.title,
        executionModel: executionData.executionModel,
        aiAgentRole: executionData.aiAgentRole,
      },
    });
  } catch (error) {
    console.error('Error handling task execution request:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process task execution request' },
      { status: 500 }
    );
  }
}