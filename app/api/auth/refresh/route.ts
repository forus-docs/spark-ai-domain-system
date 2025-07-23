import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';
import { generateTokens, verifyRefreshToken } from '@/app/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// Remove the GET method entirely to prevent redirect loops
// Only POST method should be used for refresh

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      // Return a 200 with no user data instead of 401 to prevent auth loops
      return NextResponse.json(
        { user: null, accessToken: null },
        { status: 200 }
      );
    }
    
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      
      // Get user from database
      const user = await User.findById(payload.id);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
      
      // Create response with new tokens
      const response = NextResponse.json({
        user: user.toJSON(),
        accessToken,
      });
      
      // Set new tokens in cookies
      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      response.cookies.set('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return response;
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      
      // Invalid refresh token - return 200 with null data to avoid auth loops
      const response = NextResponse.json(
        { user: null, accessToken: null },
        { status: 200 }
      );
      
      // Clear invalid tokens
      response.cookies.delete('refreshToken');
      response.cookies.delete('accessToken');
      
      return response;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}