import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import Invite from '@/app/models/Invite';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/invites
 * Create a new invite link
 * Requires authentication
 */
export async function POST(request: NextRequest) {
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
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { domainId, roleId } = body;
    
    console.log('Create invite request:', { domainId, roleId, userId: decoded.id });

    if (!domainId || !roleId) {
      console.error('Missing required fields:', { domainId, roleId });
      return NextResponse.json(
        { error: 'Domain ID and Role ID are required' },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Try to create invite with retry logic for duplicate codes
    let invite;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const code = crypto.randomBytes(4).toString('hex');
        invite = await Invite.create({
          code,
          domainId,
          roleId,
          createdBy: decoded.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
        break; // Success, exit loop
      } catch (createError: any) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, createError.message);
        
        // If it's not a duplicate key error or we've exhausted attempts, throw
        if (!createError.message?.includes('duplicate key') && !createError.message?.includes('E11000')) {
          throw createError;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique invite code after multiple attempts');
        }
        
        // Try again with a new code
        console.log('Retrying with new code...');
      }
    }

    if (!invite) {
      throw new Error('Failed to create invite');
    }

    return NextResponse.json({
      success: true,
      invite: {
        code: invite.code,
        domainId: invite.domainId,
        roleId: invite.roleId,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to create invite', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invites?code=xxx
 * Validate an invite code
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

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

    return NextResponse.json({
      success: true,
      invite: {
        domainId: invite.domainId,
        roleId: invite.roleId,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('Error validating invite:', error);
    return NextResponse.json(
      { error: 'Failed to validate invite' },
      { status: 500 }
    );
  }
}