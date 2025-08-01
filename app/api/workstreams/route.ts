import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import User from '@/app/models/User';
import { connectToDatabase } from '@/app/lib/database';
import { WorkstreamService } from '@/app/services/workstream.service';

// GET /api/workstreams - Get user's workstreams
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get domain from query params
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    // Get user's workstreams
    const workstreams = await WorkstreamService.getUserWorkstreams(session.user.id, domainId);

    // Transform the response to include member details
    const transformedWorkstreams = workstreams.map(ws => ({
      id: ws.executionId,
      name: ws.taskSnapshot.title,
      description: ws.taskSnapshot.description,
      members: ws.taskSnapshot.members,
      lastActivityAt: ws.taskSnapshot.lastActivityAt,
      createdAt: ws.createdAt
    }));

    return NextResponse.json({ workstreams: transformedWorkstreams });
  } catch (error) {
    console.error('Error fetching workstreams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workstreams' },
      { status: 500 }
    );
  }
}

// POST /api/workstreams - Create a new workstream
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domainId, name, description, memberIds } = body;

    if (!domainId || !name) {
      return NextResponse.json(
        { error: 'Domain ID and name are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    console.log('POST /api/workstreams - Request body:', body);
    console.log('User ID from token:', session.user.id);

    // Verify user is member of domain
    const user = await User.findById(session.user.id);
    if (!user) {
      console.error('User not found with ID:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    console.log('User domains:', user.domains.map((d: any) => ({
      domainId: d.domainId,
      role: d.role
    })));

    const isMember = user.domains.some((d: any) => d.domainId === domainId);
    if (!isMember) {
      console.error('User not member of domain:', domainId);
      return NextResponse.json(
        { error: 'You are not a member of this domain' },
        { status: 403 }
      );
    }

    console.log('Creating workstream with params:', {
      domainId,
      name,
      description,
      createdBy: session.user.id,
      members: memberIds || []
    });

    // Create workstream using the service
    const workstream = await WorkstreamService.createWorkstream({
      domainId,
      name,
      description,
      createdBy: session.user.id,
      members: memberIds || []
    });

    // Transform the response
    const response = {
      id: workstream.executionId,
      name: workstream.taskSnapshot.title,
      description: workstream.taskSnapshot.description,
      members: workstream.taskSnapshot.members,
      createdAt: workstream.createdAt
    };

    return NextResponse.json({ workstream: response }, { status: 201 });
  } catch (error) {
    console.error('Error creating workstream:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create workstream',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}