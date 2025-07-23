import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import UserPost from '@/app/models/UserPost';
import User from '@/app/models/User';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('=== DEBUG API CALLED ===');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Decode token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('Token decoded successfully');
      console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
    } catch (error) {
      console.error('Token decode error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = decoded.id;
    console.log('Extracted userId:', userId);
    console.log('UserId type:', typeof userId);
    console.log('UserId length:', userId?.length);
    
    // Get user from database
    const user = await User.findById(userId);
    console.log('User found:', !!user);
    if (user) {
      console.log('User email:', user.email);
      console.log('User ID from DB:', user._id.toString());
      console.log('User domains:', user.domains);
    }
    
    // Get ALL UserPosts first
    const allUserPosts = await UserPost.find({}).limit(5);
    console.log('\n=== ALL UserPosts (sample) ===');
    allUserPosts.forEach((up, index) => {
      console.log(`UserPost ${index + 1}:`);
      console.log('  _id:', up._id);
      console.log('  userId:', up.userId);
      console.log('  userId type:', typeof up.userId);
      console.log('  postId:', up.postId);
      console.log('  title:', up.postSnapshot?.title);
    });
    
    // Now query for this specific user
    console.log('\n=== Querying for specific user ===');
    console.log('Query: { userId:', userId, '}');
    
    const userPosts = await UserPost.find({ userId: userId });
    console.log('UserPosts found for this user:', userPosts.length);
    
    // Try with string conversion
    const userPostsString = await UserPost.find({ userId: userId.toString() });
    console.log('UserPosts with toString():', userPostsString.length);
    
    // Try to find by exact match from sample
    if (allUserPosts.length > 0) {
      const sampleUserId = allUserPosts[0].userId;
      console.log('\n=== Testing with sample userId ===');
      console.log('Sample userId:', sampleUserId);
      console.log('Does it match our userId?', sampleUserId === userId);
      console.log('Does it match with toString?', sampleUserId === userId.toString());
      
      const testQuery = await UserPost.find({ userId: sampleUserId });
      console.log('UserPosts found with sample userId:', testQuery.length);
    }
    
    return NextResponse.json({
      debug: {
        tokenUserId: userId,
        userIdType: typeof userId,
        userExists: !!user,
        userEmail: user?.email,
        totalUserPosts: allUserPosts.length,
        userPostsForUser: userPosts.length,
        sampleUserPost: allUserPosts[0] ? {
          userId: allUserPosts[0].userId,
          userIdType: typeof allUserPosts[0].userId,
          title: allUserPosts[0].postSnapshot?.title
        } : null
      },
      userPosts: userPosts
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}