import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import DomainTask from '@/app/models/DomainTask';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all workstream tasks
    const tasks = await DomainTask.find({ taskType: 'workstream_basic' }).lean();
    
    return NextResponse.json({ 
      success: true,
      count: tasks.length,
      tasks: tasks.map(t => ({
        id: t._id,
        domain: t.domain,
        domainType: typeof t.domain,
        name: t.name
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}