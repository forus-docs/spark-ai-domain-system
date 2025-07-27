import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import DomainTask from '@/app/models/DomainTask';

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
    
    try {
      verifyAccessToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const category = searchParams.get('category');
    const taskType = searchParams.get('taskType');

    // Build query
    const query: any = { isActive: true };
    
    if (domain) {
      // Include tasks for the specific domain AND universal tasks (domain='all')
      query.$or = [
        { domain: domain },
        { domain: 'all' }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (taskType) {
      query.taskType = taskType;
    }

    // Get domain tasks
    const tasks = await DomainTask.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .lean();
    
    // Convert _id to id for frontend consistency
    const formattedTasks = tasks.map((task: any) => ({
      ...task,
      id: task._id.toString(),
      _id: undefined
    }));
    
    console.log(`Domain tasks retrieved: ${formattedTasks.length} for domain: ${domain}, category: ${category}`);
    return NextResponse.json({ posts: formattedTasks }); // Keep 'posts' for backward compatibility with frontend
  } catch (error) {
    console.error('Error fetching domain tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain tasks' },
      { status: 500 }
    );
  }
}