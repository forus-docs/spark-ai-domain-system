import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { TaskExecutionService, ExecutionMessageService } from '@/app/services/task-executions';
import { connectToDatabase } from '@/app/lib/database';
import mongoose from 'mongoose';
import MasterTask from '@/app/models/MasterTask';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  let userId = 'anonymous'; // Default fallback
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      userId = decoded.id; // JWT payload has 'id' field
    } catch (error) {
      console.error('Invalid auth token:', error);
      // In development, allow fallback to anonymous
      // In production, this would be a hard failure
      if (process.env.NODE_ENV !== 'development') {
        return new Response('Invalid token', { status: 401 });
      }
    }
  } else if (process.env.NODE_ENV !== 'development') {
    // Require auth in production
    return new Response('Unauthorized', { status: 401 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  console.log('GET /api/task-executions - params:', { userId, domainId, limit, offset });

  try {
    // Get executions and filter by domain if requested
    const executions = await TaskExecutionService.getUserTaskExecutions(
      userId,
      domainId || undefined, // Pass domainId to service if provided
      limit,
      offset
    );

    console.log(`Found ${executions?.length || 0} executions for user ${userId} in domain ${domainId}`);

    return NextResponse.json({ executions: executions || [] });
  } catch (error) {
    console.error('Error fetching task executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task executions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectToDatabase();

  const isDevelopment = process.env.NODE_ENV === 'development';
  let userId = 'anonymous';

  if (!isDevelopment) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      userId = decoded.id; // JWT payload has 'id' field
    } catch (error) {
      return new Response('Invalid token', { status: 401 });
    }
  }

  const { executionId } = await request.json();

  if (!executionId) {
    return NextResponse.json(
      { error: 'executionId is required' },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const taskExecution = await TaskExecutionService.getTaskExecution(executionId);
    if (!taskExecution || taskExecution.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Task execution not found' },
        { status: 404 }
      );
    }

    const deleted = await TaskExecutionService.deleteTaskExecution(executionId);
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete task execution' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting task execution:', error);
    return NextResponse.json(
      { error: 'Failed to delete task execution' },
      { status: 500 }
    );
  }
}