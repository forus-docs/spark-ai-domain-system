import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import DomainTask from '@/app/models/DomainTask';
import User from '@/app/models/User';
import Domain from '@/app/models/Domain';
import MasterTask from '@/app/models/MasterTask';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user details
    const user = await User.findById(payload.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current domain from user
    const currentDomainId = user.currentDomainId;
    
    // Debug info collection
    const debugInfo: any = {
      userId: user._id,
      userName: user.name,
      currentDomainId: currentDomainId?.toString(),
      userDomains: user.domains.map((d: any) => ({
        domainId: d.domainId,
        domainName: 'Unknown', // We'll need to look up domain names separately
        role: d.role,
        joinedAt: d.joinedAt
      }))
    };

    if (currentDomainId) {
      // Get domain details
      const domain = await Domain.findById(currentDomainId);
      debugInfo.currentDomainDetails = {
        id: domain?._id?.toString(),
        name: domain?.name,
        slug: domain?.slug
      };

      // Check for workstream tasks in current domain
      const workstreamTasksInDomain = await DomainTask.find({
        domain: currentDomainId,
        taskType: 'workstream_basic'
      });

      debugInfo.workstreamTasksInCurrentDomain = workstreamTasksInDomain.map(task => ({
        id: task._id?.toString(),
        name: task.name,
        title: task.title,
        taskType: task.taskType,
        masterTaskId: task.masterTaskId
      }));
    }

    // Check all workstream tasks across all domains
    const allWorkstreamTasks = await DomainTask.find({
      taskType: 'workstream_basic'
    }).populate('domain');

    debugInfo.allWorkstreamTasksInDatabase = allWorkstreamTasks.map(task => ({
      id: task._id?.toString(),
      name: task.name,
      domainId: task.domain?._id?.toString(),
      domainName: (task.domain as any)?.name,
      taskType: task.taskType
    }));

    // Check master task
    const masterWorkstreamTask = await MasterTask.findOne({
      taskType: 'workstream_basic'
    });

    debugInfo.masterWorkstreamTask = masterWorkstreamTask ? {
      id: masterWorkstreamTask._id?.toString(),
      masterTaskId: masterWorkstreamTask.masterTaskId,
      name: masterWorkstreamTask.name,
      taskType: masterWorkstreamTask.taskType
    } : null;

    // Check if user is member of current domain
    if (currentDomainId) {
      const isMember = user.domains.some((d: any) => 
        d.domainId === currentDomainId.toString()
      );
      debugInfo.isUserMemberOfCurrentDomain = isMember;
    }

    return NextResponse.json({ 
      debug: debugInfo,
      recommendation: !debugInfo.workstreamTasksInCurrentDomain?.length 
        ? 'No workstream task found in current domain. Run: npx tsx scripts/auto-adopt-workstream.ts'
        : 'Workstream task exists in domain'
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}