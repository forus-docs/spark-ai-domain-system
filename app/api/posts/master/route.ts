import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import Post from '@/app/models/Post';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      verifyAccessToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const category = searchParams.get('category');
    const postType = searchParams.get('postType');

    // Build query
    const query: any = { isActive: true };
    
    if (domain) {
      // Include posts for the specific domain AND universal posts (domain='all')
      query.$or = [
        { domain: domain },
        { domain: 'all' }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (postType) {
      query.postType = postType;
    }

    // Get master posts
    const posts = await Post.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .lean();
    
    // Convert _id to id for frontend consistency
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      id: post._id.toString(),
      _id: undefined
    }));
    
    console.log(`Master posts retrieved: ${formattedPosts.length} for domain: ${domain}, category: ${category}`);
    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching master posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master posts' },
      { status: 500 }
    );
  }
}