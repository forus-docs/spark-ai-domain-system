import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import Process from '@/app/models/MasterTask';

export async function GET(
  request: NextRequest,
  { params }: { params: { processId: string } }
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

    // Find the process
    const process = await Process.findOne({ processId: params.processId });
    
    if (!process) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      );
    }

    // Return process data
    return NextResponse.json({
      process: {
        processId: process.processId,
        name: process.name,
        description: process.description,
        category: process.category,
        executionModel: process.executionModel,
        currentStage: process.currentStage,
        aiAgentAttached: process.aiAgentAttached,
        aiAgentRole: process.aiAgentRole,
        requiredParameters: process.requiredParameters,
        systemPrompt: process.systemPrompt,
        intro: process.intro,
        standardOperatingProcedure: process.standardOperatingProcedure,
      }
    });
  } catch (error) {
    console.error('Error fetching process:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}