import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';
import Domain from '@/app/models/Domain';
import { generateTokens } from '@/app/lib/auth/jwt';
import { TaskJourneyService } from '@/app/lib/services/task-journey.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { email, password, name, username } = await request.json();

    // Validate input (username is optional for now)
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      username: username || email.split('@')[0], // Default username from email
    });

    await user.save();

    // Check if there's an intended domain cookie
    const intendedDomain = request.cookies.get('intendedDomain')?.value;
    if (intendedDomain) {
      console.log('[Register] Intended domain found:', intendedDomain);
      
      // Find the domain by slug
      const domain = await Domain.findOne({ slug: intendedDomain });
      if (domain) {
        console.log('[Register] Adding user to domain:', domain.name);
        
        // Add user to domain WITHOUT a role - they need to select one
        user.domains = [{
          domainId: domain._id.toString(),
          role: null, // No role assigned yet
          joinedAt: new Date()
        }];
        
        // Set as current domain
        user.currentDomainId = domain._id.toString();
        
        await user.save();
        console.log('[Register] User added to domain successfully');
      } else {
        console.log('[Register] Domain not found for slug:', intendedDomain);
      }
    }

    // Initialize user posts (identity verification)
    await TaskJourneyService.initializeUserTasks(user._id.toString());

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Create response with cookies
    const response = NextResponse.json({
      user: user.toJSON(),
      accessToken,
    });

    // Set access token in cookie (for middleware)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token in cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Clear the intended domain cookie if it exists
    response.cookies.delete('intendedDomain');

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}