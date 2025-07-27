import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import TaskExecution from '@/app/models/TaskExecution';
import MasterTask from '@/app/models/MasterTask';
import ExecutionMessage from '@/app/models/ExecutionMessage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let userId: string;
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded.id;
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get domain from query params
    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get('domain');
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    // First, get all domainTaskIds for this domain (domain tasks without userId)
    const domainTasks = await MasterTask.find({ 
      domain: domainId,
      userId: { $exists: false }
    }).select('_id');
    const domainTaskIds = domainTasks.map(dt => dt._id.toString());

    // Fetch recent task executions for this user in this domain
    const executions = await TaskExecution.find({
      userId,
      domainTaskId: { $in: domainTaskIds }
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

    // For each execution, get the last message to show as preview
    const executionsWithPreviews = await Promise.all(
      executions.map(async (execution) => {
        // Get the last message
        const lastMessage = await ExecutionMessage.findOne({
          executionId: execution.executionId,
          role: { $in: ['user', 'assistant'] }
        })
        .sort({ createdAt: -1 })
        .select('content role createdAt')
        .lean();

        // Get message count
        const messageCount = await ExecutionMessage.countDocuments({
          executionId: execution.executionId
        });

        return {
          executionId: execution.executionId,
          title: execution.title,
          updatedAt: execution.updatedAt,
          createdAt: execution.createdAt,
          lastMessage: lastMessage ? {
            content: (lastMessage as any).content.substring(0, 150) + ((lastMessage as any).content.length > 150 ? '...' : ''),
            role: (lastMessage as any).role,
            createdAt: (lastMessage as any).createdAt
          } : null,
          messageCount
        };
      })
    );

    return NextResponse.json({ 
      executions: executionsWithPreviews,
      total: executionsWithPreviews.length
    });
  } catch (error) {
    console.error('Error fetching recent executions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent executions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}