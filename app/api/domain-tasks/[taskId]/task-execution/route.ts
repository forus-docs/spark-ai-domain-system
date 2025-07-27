import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    taskId: string;
  };
}

/**
 * POST /api/domain-tasks/[taskId]/task-execution
 * DEPRECATED: This endpoint was for the old UserTask model
 * Task executions are now created during assignment via /api/domain-tasks/assign
 */
export async function POST(request: NextRequest, context: RouteContext) {
  return NextResponse.json({ 
    error: 'This endpoint is deprecated. Task executions are created during assignment.' 
  }, { status: 410 });
}