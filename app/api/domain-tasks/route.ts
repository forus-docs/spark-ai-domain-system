import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { connectToDatabase } from '@/app/lib/database';
import { TaskJourneyService } from '@/app/lib/services/task-journey.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    console.log('API /domain-tasks called');
    
    // Get token from Authorization header (case-insensitive)
    // Get session from NextAuth
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  console.log('Verified user ID:', userId);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const includeHidden = searchParams.get('includeHidden') === 'true';

    // Get user tasks
    console.log('Calling getUserTasks with:', { userId, domain, includeCompleted, includeHidden });
    const tasks = await TaskJourneyService.getUserTasks(userId, {
      domain: domain || undefined,
      includeCompleted,
      includeHidden,
    });
    
    console.log('Tasks retrieved:', tasks.length);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}