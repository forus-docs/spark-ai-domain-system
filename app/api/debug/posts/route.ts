import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import MasterTask from '@/app/models/MasterTask';
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
    
    // Get ALL UserTasks first
    const allUserTasks = await MasterTask.find({ userId: { $exists: true } }).limit(5);
    console.log('\n=== ALL UserTasks (sample) ===');
    allUserTasks.forEach((task, index) => {
      console.log(`UserTask ${index + 1}:`);
      console.log('  _id:', task._id);
      console.log('  userId:', task.userId);
      console.log('  userId type:', typeof task.userId);
      console.log('  domainTaskId:', task.domainTaskId);
      console.log('  title:', task.title);
    });
    
    // Now query for this specific user
    console.log('\n=== Querying for specific user ===');
    console.log('Query: { userId:', userId, '}');
    
    const userTasks = await MasterTask.find({ userId: userId });
    console.log('UserTasks found for this user:', userTasks.length);
    
    // Try with string conversion
    const userTasksString = await MasterTask.find({ userId: userId.toString() });
    console.log('UserTasks with toString():', userTasksString.length);
    
    // Try to find by exact match from sample
    if (allUserTasks.length > 0) {
      const sampleUserId = allUserTasks[0].userId;
      console.log('\n=== Testing with sample userId ===');
      console.log('Sample userId:', sampleUserId);
      console.log('Does it match our userId?', sampleUserId === userId);
      console.log('Does it match with toString?', sampleUserId === userId.toString());
      
      const testQuery = await MasterTask.find({ userId: sampleUserId });
      console.log('UserTasks found with sample userId:', testQuery.length);
    }
    
    return NextResponse.json({
      debug: {
        tokenUserId: userId,
        userIdType: typeof userId,
        userExists: !!user,
        userEmail: user?.email,
        totalUserTasks: allUserTasks.length,
        userTasksForUser: userTasks.length,
        sampleUserTask: allUserTasks[0] ? {
          userId: allUserTasks[0].userId,
          userIdType: typeof allUserTasks[0].userId,
          title: allUserTasks[0].title
        } : null
      },
      userTasks: userTasks
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}