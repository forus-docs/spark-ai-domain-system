import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';
import { DomainAdoptionService } from '@/app/services/domain-adoption.service';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    domainId: string;
  };
}

/**
 * GET /api/domains/[domainId]/adopt-task
 * Returns available MasterTasks that can be adopted by this domain
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

    // Verify user is a member of this domain
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMember = user.domains?.some((d: any) => 
      d.domainId === domainId
    );

    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Use the service to get available tasks
    const availableTasks = await DomainAdoptionService.getAvailableTasksForAdoption(domainId);

    return NextResponse.json({ 
      availableTasks,
      totalAvailable: availableTasks.length
    });

  } catch (error) {
    console.error('Error fetching available tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/domains/[domainId]/adopt-task
 * Adopts a MasterTask into a domain using the unified schema
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
    const { masterTaskId, customizations } = await request.json();

    if (!masterTaskId) {
      return NextResponse.json({ error: 'masterTaskId is required' }, { status: 400 });
    }

    // Verify user is an admin of this domain
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domainMembership = user.domains?.find((d: any) => 
      (d.domain?.toString() === domainId || d.domainId === domainId)
    );

    if (!domainMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Note: For now, any domain member can adopt tasks
    // To restrict to admins only, uncomment:
    // if (domainMembership.role !== 'admin') {
    //   return NextResponse.json({ error: 'Only domain admins can adopt tasks' }, { status: 403 });
    // }

    // Use the service to adopt the task
    const result = await DomainAdoptionService.adoptMasterTask({
      domainId,
      masterTaskId,
      adoptedBy: userId,
      customizations
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to adopt task' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      domainTask: result.domainTask,
      message: 'Task successfully adopted'
    });

  } catch (error) {
    console.error('Error adopting task:', error);
    return NextResponse.json(
      { error: 'Failed to adopt task' },
      { status: 500 }
    );
  }
}