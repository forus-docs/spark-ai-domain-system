import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import { PostJourneyService } from '@/app/lib/services/post-journey.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    console.log('API /posts called');
    
    // Get token from Authorization header (case-insensitive)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let userId: string;
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded.id;
      console.log('Verified user ID:', userId);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const includeHidden = searchParams.get('includeHidden') === 'true';

    // Get user posts
    console.log('Calling getUserPosts with:', { userId, domain, includeCompleted, includeHidden });
    const posts = await PostJourneyService.getUserPosts(userId, {
      domain: domain || undefined,
      includeCompleted,
      includeHidden,
    });
    
    console.log('Posts retrieved:', posts.length);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}