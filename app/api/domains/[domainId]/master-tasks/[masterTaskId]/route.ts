import { NextRequest, NextResponse } from 'next/server';
import { verifyDomainAccess, createUnauthorizedResponse } from '@/app/lib/auth/domain-access';
import { connectToDatabase } from '@/app/lib/database';
import MasterTask from '@/app/models/MasterTask';
import DomainTask from '@/app/models/DomainTask';

export async function GET(
  request: NextRequest,
  { params }: { params: { domainId: string; masterTaskId: string } }
) {
  try {
    // Verify domain access
    const accessCheck = await verifyDomainAccess(request, params.domainId);
    if (!accessCheck.isValid) {
      return createUnauthorizedResponse(accessCheck.error!, accessCheck.statusCode!);
    }

    // Connect to database
    await connectToDatabase();

    // First check if this master task is adopted by the domain
    const domainTask = await DomainTask.findOne({
      domain: params.domainId,
      masterTaskId: params.masterTaskId,
      isActive: true
    });

    if (!domainTask) {
      return NextResponse.json(
        { error: 'This task is not available in this domain' },
        { status: 404 }
      );
    }

    // Find the master task
    const masterTask = await MasterTask.findOne({ 
      $or: [
        { masterTaskId: params.masterTaskId },
        { _id: params.masterTaskId }
      ]
    });
    
    if (!masterTask) {
      return NextResponse.json(
        { error: 'Master task not found' },
        { status: 404 }
      );
    }

    // Return master task data with domain-specific customizations
    return NextResponse.json({
      process: {
        id: masterTask._id.toString(),
        masterTaskId: masterTask.masterTaskId || masterTask._id.toString(),
        name: domainTask.title || masterTask.name,
        description: domainTask.description || masterTask.description,
        category: masterTask.category,
        executionModel: masterTask.executionModel,
        currentStage: masterTask.currentStage,
        aiAgentAttached: masterTask.aiAgentAttached,
        aiAgentRole: masterTask.aiAgentRole,
        requiredParameters: masterTask.requiredParameters,
        systemPrompt: masterTask.systemPrompt,
        intro: masterTask.intro,
        standardOperatingProcedure: masterTask.standardOperatingProcedure,
        // Domain-specific fields
        domainCustomizations: domainTask.customizations,
        isActive: domainTask.isActive,
      }
    });
  } catch (error) {
    console.error('Error fetching master task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}