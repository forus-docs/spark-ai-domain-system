import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/start-task
 * DEPRECATED: This endpoint was for the old UserTask model
 * Use /api/domain-tasks/assign instead which returns executionId directly
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'This endpoint is deprecated. Use /api/domain-tasks/assign instead.' 
  }, { status: 410 });
}