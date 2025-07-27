import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';
import { TaskJourneyService } from '@/app/lib/services/task-journey.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  let userId = 'anonymous'; // Default fallback
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      userId = decoded.id; // JWT payload has 'id' field
    } catch (error) {
      console.error('Invalid auth token:', error);
      if (process.env.NODE_ENV !== 'development') {
        return new Response('Invalid token', { status: 401 });
      }
    }
  } else if (process.env.NODE_ENV !== 'development') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      domains: user.domains || [],
      currentDomainId: user.currentDomainId,
    });
  } catch (error) {
    console.error('Error fetching user domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

/**
 * Domain Join API Endpoint
 * 
 * This endpoint handles the domain joining process which consists of:
 * 1. Role selection (roleId provided in request)
 * 2. Membership payment (handled externally, this endpoint assumes payment is complete)
 * 3. Domain assignment to the user
 * 
 * IMPORTANT: Identity verification is NOT part of this flow.
 * Identity verification is a separate process handled through posts
 * on the home screen after the user has joined a domain.
 */
export async function POST(request: NextRequest) {
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  let userId = 'anonymous'; // Default fallback
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      userId = decoded.id; // JWT payload has 'id' field
    } catch (error) {
      console.error('Invalid auth token:', error);
      // In development, allow fallback to anonymous
      // In production, this would be a hard failure
      if (process.env.NODE_ENV !== 'development') {
        return new Response('Invalid token', { status: 401 });
      }
    }
  } else if (process.env.NODE_ENV !== 'development') {
    // Require auth in production
    return new Response('Unauthorized', { status: 401 });
  }

  const { domainId, roleId } = await request.json();

  if (!domainId || !roleId) {
    return NextResponse.json(
      { error: 'domainId and roleId are required' },
      { status: 400 }
    );
  }

  try {
    // First check if user exists and hasn't already joined this domain
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already joined
    const existingDomainIndex = user.domains.findIndex((d: any) => d.domainId === domainId);
    
    let updatedUser;
    
    if (existingDomainIndex !== -1) {
      // User is already in domain - update their role
      const updateQuery = {
        [`domains.${existingDomainIndex}.role`]: roleId,
        [`domains.${existingDomainIndex}.joinedAt`]: new Date() // Update join date on role change
      };
      
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateQuery },
        { new: true }
      );
    } else {
      // User is not in domain - add them
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            domains: {
              domainId,
              role: roleId,
              joinedAt: new Date(),
            }
          }
        },
        { new: true }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user domains' },
        { status: 500 }
      );
    }

    // Assign domain-specific onboarding posts
    await TaskJourneyService.assignDomainOnboardingTasks(userId, domainId);

    return NextResponse.json({
      success: true,
      domains: updatedUser.domains,
    });
  } catch (error) {
    console.error('Error joining domain:', error);
    return NextResponse.json(
      { error: 'Failed to join domain' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  let userId = 'anonymous'; // Default fallback
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      userId = decoded.id; // JWT payload has 'id' field
    } catch (error) {
      console.error('Invalid auth token:', error);
      // In development, allow fallback to anonymous
      // In production, this would be a hard failure
      if (process.env.NODE_ENV !== 'development') {
        return new Response('Invalid token', { status: 401 });
      }
    }
  } else if (process.env.NODE_ENV !== 'development') {
    // Require auth in production
    return new Response('Unauthorized', { status: 401 });
  }

  const { currentDomainId } = await request.json();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { currentDomainId },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      currentDomainId: user.currentDomainId,
    });
  } catch (error) {
    console.error('Error updating current domain:', error);
    return NextResponse.json(
      { error: 'Failed to update current domain' },
      { status: 500 }
    );
  }
}