import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import MasterTask from '@/app/models/MasterTask';
import DomainTask from '@/app/models/DomainTask';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    domainId: string;
  };
}

/**
 * POST /api/domains/[domainId]/adopt-task
 * QMS-COMPLIANT: Adopts a MasterTask into a domain with COMPLETE data snapshot
 * 
 * This endpoint creates a new DomainTask with a full copy of all MasterTask data,
 * ensuring QMS compliance through immutable snapshots.
 * 
 * Request body:
 * {
 *   masterTaskId: string,
 *   customizations?: {
 *     title?: string,
 *     description?: string,
 *     estimatedTime?: string,
 *     systemPrompt?: string,
 *     additionalContext?: string,
 *     reward?: { amount: number, currency: string, displayText: string }
 *   }
 * }
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

    const { domainId } = context.params;
    const body = await request.json();
    const { masterTaskId, customizations } = body;

    if (!masterTaskId) {
      return NextResponse.json({ error: 'masterTaskId is required' }, { status: 400 });
    }

    // Get user and verify domain membership
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domainMembership = user.domains.find((d: any) => d.domainId === domainId);
    if (!domainMembership) {
      return NextResponse.json({ error: 'User is not a member of this domain' }, { status: 403 });
    }

    // Check if user has admin role in domain
    if (domainMembership.role !== 'admin') {
      return NextResponse.json({ error: 'Only domain admins can adopt tasks' }, { status: 403 });
    }

    // Get the MasterTask
    const masterTask = await MasterTask.findOne({ 
      $or: [
        { masterTaskId: masterTaskId },
        { _id: masterTaskId }
      ]
    });

    if (!masterTask) {
      return NextResponse.json({ error: 'Master task not found' }, { status: 404 });
    }

    // Check if task is already adopted by this domain
    const existingDomainTask = await DomainTask.findOne({
      domain: domainId,
      masterTaskId: masterTask._id.toString(),
      isQMSCompliant: true
    });

    if (existingDomainTask) {
      return NextResponse.json({ 
        error: 'This task has already been adopted by your domain' 
      }, { status: 400 });
    }

    // Map task type from MasterTask category
    const taskTypeMapping: Record<string, string> = {
      'identity': 'identity_verification',
      'onboarding': 'onboarding',
      'training': 'training',
      'operational': 'task',
      'compliance': 'compliance',
      'financial': 'task'
    };

    const taskType = taskTypeMapping[masterTask.category] || 'task';

    // Generate display configuration
    const displayConfig = generateDisplayConfig(masterTask);

    // Create QMS-compliant DomainTask with COMPLETE snapshot
    const domainTask = new DomainTask({
      // Domain-specific fields
      domain: domainId,
      title: customizations?.title || masterTask.name,
      description: customizations?.description || masterTask.description,
      taskType: taskType,
      
      // References (for audit trail)
      masterTaskId: masterTask._id.toString(),
      masterTaskVersion: masterTask.standardOperatingProcedure?.metadata?.version || '1.0.0',
      originalMasterTaskId: masterTask._id.toString(),
      
      // Complete MasterTask snapshot (QMS Compliant)
      masterTaskSnapshot: {
        name: masterTask.name,
        category: masterTask.category,
        executionModel: masterTask.executionModel,
        currentStage: masterTask.currentStage,
        
        // AI Configuration
        aiAgentAttached: masterTask.aiAgentAttached || false,
        aiAgentRole: masterTask.aiAgentRole,
        aiAgentId: masterTask.aiAgentId,
        systemPrompt: masterTask.systemPrompt,
        intro: masterTask.intro,
        
        // Execution data
        standardOperatingProcedure: masterTask.standardOperatingProcedure,
        contextDocuments: masterTask.contextDocuments || [],
        requiredParameters: masterTask.requiredParameters || [],
        checklist: masterTask.checklist || [],
        
        // Form/workflow/training data
        formSchema: masterTask.formSchema,
        validationRules: masterTask.validationRules,
        workflowDefinition: masterTask.workflowDefinition,
        curriculum: masterTask.curriculum || [],
        
        // Metadata
        sopMetadata: masterTask.sopMetadata || {}
      },
      
      // Domain customizations
      domainCustomizations: customizations || {},
      
      // Adoption metadata
      adoptedAt: new Date(),
      adoptedBy: userId,
      adoptionNotes: `Adopted by ${user.name} via QMS-compliant API`,
      
      // Display configuration
      ...displayConfig,
      
      // Task behavior
      requiresIdentityVerification: masterTask.category !== 'identity',
      prerequisiteTasks: [],
      nextTasks: [],
      canHide: true,
      priority: customizations?.priority || 'normal',
      category: masterTask.category === 'identity' ? 'required' : 'recommended',
      
      // Additional metadata
      estimatedTime: customizations?.estimatedTime || masterTask.sopMetadata?.estimatedDuration || '30 minutes',
      reward: customizations?.reward,
      version: '1.0.0',
      
      // Status flags
      isActive: true,
      isActiveInDomain: true,
      isQMSCompliant: true
    });

    // Special handling for identity verification tasks
    if (masterTask.category === 'identity') {
      domainTask.ctaAction.type = 'process';
      domainTask.priority = 'urgent';
      domainTask.category = 'required';
      domainTask.requiresIdentityVerification = false;
    }

    // Save the new domain task
    await domainTask.save();

    // Update MasterTask adoption tracking
    await MasterTask.findByIdAndUpdate(masterTask._id, {
      $push: {
        adoptedByDomains: {
          domainId: domainId,
          adoptedAt: new Date(),
          allowedRoles: ['user', 'admin'], // Default to all roles
          customName: customizations?.title,
          customDescription: customizations?.description,
          isActive: true
        }
      }
    });

    console.log(`Domain ${domainId} adopted MasterTask ${masterTask.name} with QMS-compliant snapshot`);

    // Return the created domain task
    return NextResponse.json({
      success: true,
      domainTask: {
        id: domainTask._id.toString(),
        title: domainTask.title,
        description: domainTask.description,
        taskType: domainTask.taskType,
        masterTaskId: domainTask.masterTaskId,
        isQMSCompliant: domainTask.isQMSCompliant
      },
      message: 'Task successfully adopted with complete data snapshot'
    });

  } catch (error) {
    console.error('Error adopting task:', error);
    return NextResponse.json(
      { error: 'Failed to adopt task' },
      { status: 500 }
    );
  }
}

/**
 * Generate display configuration based on masterTask properties
 */
function generateDisplayConfig(masterTask: any) {
  // Icon mapping based on category
  const iconMapping: Record<string, string> = {
    'identity': 'shield',
    'onboarding': 'users',
    'training': 'book',
    'operational': 'briefcase',
    'compliance': 'checklist',
    'financial': 'lightbulb'
  };
  
  // Color mapping based on category
  const colorMapping: Record<string, string> = {
    'identity': 'blue',
    'onboarding': 'green',
    'training': 'purple',
    'operational': 'orange',
    'compliance': 'gray',
    'financial': 'blue'
  };
  
  // CTA text based on execution model
  const ctaTextMapping: Record<string, string> = {
    'form': 'Fill Form',
    'sop': 'Start Process',
    'knowledge': 'Learn More',
    'bpmn': 'Start Workflow',
    'training': 'Start Training'
  };
  
  return {
    iconType: iconMapping[masterTask.category] || 'briefcase',
    colorScheme: colorMapping[masterTask.category] || 'blue',
    ctaText: ctaTextMapping[masterTask.executionModel] || 'Start',
    ctaAction: {
      type: 'process',
      target: masterTask._id.toString(),
      params: {}
    }
  };
}

/**
 * GET /api/domains/[domainId]/adopt-task
 * Lists available MasterTasks that can be adopted by the domain
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
    const { domainId } = context.params;

    // Get user and verify domain membership
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domainMembership = user.domains.find((d: any) => d.domainId === domainId);
    if (!domainMembership || domainMembership.role !== 'admin') {
      return NextResponse.json({ error: 'Only domain admins can view adoptable tasks' }, { status: 403 });
    }

    // Get all active MasterTasks
    const masterTasks = await MasterTask.find({ active: true });

    // Get already adopted tasks for this domain
    const adoptedTasks = await DomainTask.find({ 
      domain: domainId,
      isQMSCompliant: true 
    }).select('masterTaskId');
    
    const adoptedMasterTaskIds = new Set(adoptedTasks.map(t => t.masterTaskId));

    // Filter out already adopted tasks and format response
    const availableTasks = masterTasks
      .filter(task => {
        const taskId = task._id.toString();
        return !adoptedMasterTaskIds.has(taskId);
      })
      .map(task => ({
        id: task._id.toString(),
        name: task.name,
        description: task.description,
        category: task.category,
        executionModel: task.executionModel,
        currentStage: task.currentStage,
        aiAgentAttached: task.aiAgentAttached,
        estimatedDuration: task.sopMetadata?.estimatedDuration,
        complianceStandards: task.sopMetadata?.complianceStandards,
        alreadyAdoptedByCount: task.adoptedByDomains?.length || 0
      }));

    return NextResponse.json({
      availableTasks,
      totalAvailable: availableTasks.length,
      alreadyAdopted: adoptedTasks.length
    });

  } catch (error) {
    console.error('Error fetching adoptable tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adoptable tasks' },
      { status: 500 }
    );
  }
}