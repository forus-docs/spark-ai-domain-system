import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import MasterTask from '@/app/models/MasterTask';

export async function GET(
  request: NextRequest,
  { params }: { params: { masterTaskId: string } }
) {
  try {
    // Connect to database
    await connectToDatabase();

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = await verifyAccessToken(token);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
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

    // Return master task data
    return NextResponse.json({
      process: {
        masterTaskId: masterTask.masterTaskId || masterTask._id.toString(),
        name: masterTask.name,
        description: masterTask.description,
        category: masterTask.category,
        executionModel: masterTask.executionModel,
        currentStage: masterTask.currentStage,
        aiAgentAttached: masterTask.aiAgentAttached,
        aiAgentRole: masterTask.aiAgentRole,
        requiredParameters: masterTask.requiredParameters,
        systemPrompt: masterTask.systemPrompt,
        intro: masterTask.intro,
        standardOperatingProcedure: masterTask.standardOperatingProcedure,
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