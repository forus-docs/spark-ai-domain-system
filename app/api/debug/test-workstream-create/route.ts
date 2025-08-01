import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { connectToDatabase } from '@/app/lib/database';
import DomainTask from '@/app/models/DomainTask';
import User from '@/app/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test workstream create - Request body:', body);

    // Verify authentication
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domainId = body.domainId;
    console.log('Domain ID from request:', domainId);
    console.log('Domain ID type:', typeof domainId);

    // Test the exact query
    const workstreamTask = await DomainTask.findOne({
      domain: domainId,
      taskType: 'workstream_basic'
    });

    console.log('Query result:', workstreamTask ? 'FOUND' : 'NOT FOUND');
    if (workstreamTask) {
      console.log('Found task:', {
        _id: workstreamTask._id,
        name: workstreamTask.name,
        domain: workstreamTask.domain
      });
    }

    // Also try with toString()
    const domainIdString = domainId.toString();
    const workstreamTask2 = await DomainTask.findOne({
      domain: domainIdString,
      taskType: 'workstream_basic'
    });

    console.log('Query with toString() result:', workstreamTask2 ? 'FOUND' : 'NOT FOUND');

    // Count all tasks in domain
    const taskCount = await DomainTask.countDocuments({ domain: domainId });
    const taskCount2 = await DomainTask.countDocuments({ domain: domainIdString });

    return NextResponse.json({ 
      success: true,
      debug: {
        domainId,
        domainIdType: typeof domainId,
        domainIdString,
        workstreamTaskFound: !!workstreamTask,
        workstreamTaskFoundWithToString: !!workstreamTask2,
        totalTasksInDomain: taskCount,
        totalTasksInDomainWithToString: taskCount2,
        userCurrentDomain: user.currentDomainId?.toString(),
        userDomains: user.domains.map((d: any) => ({
          domainId: d.domainId,
          role: d.role
        }))
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}