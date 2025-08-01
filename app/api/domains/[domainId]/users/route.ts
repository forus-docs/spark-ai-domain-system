import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import User from '@/app/models/User';
import { connectToDatabase } from '@/app/lib/database';
import { Types } from 'mongoose';

interface RouteParams {
  params: {
    domainId: string;
  };
}

// GET /api/domains/[domainId]/users - Get all users in a domain
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domainId } = params;
    await connectToDatabase();

    // Verify user is member of domain
    const requestingUser = await User.findById(session.user.id);
    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const isMember = requestingUser.domains.some((d: any) => 
      d.domainId === domainId
    );

    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this domain' },
        { status: 403 }
      );
    }

    // Find all users who are members of this domain
    const users = await User.find({
      'domains.domainId': domainId
    }).select('name email identity');

    // Transform users for response
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isVerified: user.identity?.isVerified || false
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching domain users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}