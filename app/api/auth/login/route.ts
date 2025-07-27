import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';
import Domain from '@/app/models/Domain';
import { generateTokens } from '@/app/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called');
    try {
      await connectToDatabase();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    console.log('User found:', !!user);

    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if there's an intended domain cookie and user has no domains
    const intendedDomain = request.cookies.get('intendedDomain')?.value;
    if (intendedDomain && (!user.domains || user.domains.length === 0)) {
      console.log('[Login] Intended domain found for user without domains:', intendedDomain);
      
      // Find the domain by slug
      const domain = await Domain.findOne({ slug: intendedDomain });
      if (domain) {
        console.log('[Login] Adding user to domain:', domain.name);
        
        // Add user to domain WITHOUT a role - they need to select one
        user.domains = [{
          domainId: domain._id.toString(),
          role: null, // No role assigned yet
          joinedAt: new Date()
        }];
        
        // Set as current domain
        user.currentDomainId = domain._id.toString();
        
        await user.save();
        console.log('[Login] User added to domain successfully');
      }
    }

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}