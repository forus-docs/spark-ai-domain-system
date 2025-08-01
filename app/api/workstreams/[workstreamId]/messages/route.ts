import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import ExecutionMessage from '@/app/models/ExecutionMessage';
import { connectToDatabase } from '@/app/lib/database';
import { WorkstreamService } from '@/app/services/workstream.service';
import { v4 as uuidv4 } from 'uuid';

interface RouteParams {
  params: {
    workstreamId: string;
  };
}

// GET /api/workstreams/[workstreamId]/messages - Get messages for a workstream
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workstreamId } = params;
    await connectToDatabase();

    // Verify user is member of workstream
    const isMember = await WorkstreamService.isMember(workstreamId, session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this workstream' },
        { status: 403 }
      );
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    // Fetch messages using the service
    const messages = await WorkstreamService.getMessages(workstreamId, limit, before || undefined);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/workstreams/[workstreamId]/messages - Store a new message
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workstreamId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify user is member of workstream
    const isMember = await WorkstreamService.isMember(workstreamId, session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this workstream' },
        { status: 403 }
      );
    }

    // Create message using ExecutionMessage
    const message = new ExecutionMessage({
      messageId: uuidv4(),
      executionId: workstreamId,
      role: 'user',
      content,
      text: content,
      userId: session.user.id,
      isCreatedByUser: true
    });

    await message.save();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}