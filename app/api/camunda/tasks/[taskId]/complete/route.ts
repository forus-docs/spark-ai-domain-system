import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Verify authentication
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get auth from header - supports both Basic and Bearer
    const authHeader = request.headers.get('Authorization');
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    
    // Prefer Authorization header (Bearer token) over X-Camunda-Auth (Basic)
    let finalAuthHeader = authHeader;
    if (!finalAuthHeader && camundaAuth) {
      finalAuthHeader = `Basic ${camundaAuth}`;
    }

    const body = await request.json();
    const { variables = {} } = body;

    // Complete the task
    const response = await fetch(
      `${CAMUNDA_BASE_URL}/task/${params.taskId}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(finalAuthHeader && { 'Authorization': finalAuthHeader }),
        },
        body: JSON.stringify({ variables }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Camunda API error: ${response.statusText} - ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    );
  }
}