import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { connectToDatabase } from '@/app/lib/database';
import TaskExecution from '@/app/models/TaskExecution';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const domainId = searchParams.get('domain');

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    if (!filter || !['to-me', 'by-me'].includes(filter)) {
      return NextResponse.json({ error: 'Valid filter parameter required (to-me or by-me)' }, { status: 400 });
    }

    await connectToDatabase();

    // For now, we only support 'to-me' filter since we don't track who assigned tasks
    if (filter === 'by-me') {
      return NextResponse.json({ 
        tasks: [],
        count: 0,
        filter
      });
    }

    // Fetch user's task executions for this domain
    const executions = await TaskExecution.find({
      userId,
      domainId,
      status: { $in: ['assigned', 'in_progress'] } // Active executions only
    })
    .sort({ assignedAt: -1 })
    .lean();

    // Transform to match expected format
    const tasks = executions.map(exec => ({
      _id: exec._id,
      executionId: exec.executionId,
      title: exec.taskSnapshot.title,
      description: exec.taskSnapshot.description,
      taskType: exec.taskSnapshot.taskType,
      executionModel: exec.taskSnapshot.executionModel,
      status: exec.status,
      assignedAt: exec.assignedAt,
      startedAt: exec.startedAt,
      reward: exec.taskSnapshot.reward,
      estimatedDuration: exec.taskSnapshot.estimatedDuration,
      difficultyLevel: exec.taskSnapshot.difficultyLevel
    }));

    return NextResponse.json({ 
      tasks,
      count: tasks.length,
      filter
    });

  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned tasks' },
      { status: 500 }
    );
  }
}