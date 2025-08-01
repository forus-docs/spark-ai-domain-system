import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import Invite from '@/app/models/Invite';

export const dynamic = 'force-dynamic';

/**
 * POST /api/invites/use
 * Mark an invite as used
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  // Get session from NextAuth
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = session.user;
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the invite
    const invite = await Invite.findOne({ code });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if invite is valid
    if (!invite.isValid()) {
      return NextResponse.json(
        { error: 'Invite has expired or already been used' },
        { status: 400 }
      );
    }

    // Mark invite as used
    await invite.markAsUsed(decoded.id);

    return NextResponse.json({
      success: true,
      message: 'Invite successfully used'
    });
  } catch (error) {
    console.error('Error using invite:', error);
    return NextResponse.json(
      { error: 'Failed to use invite' },
      { status: 500 }
    );
  }
}