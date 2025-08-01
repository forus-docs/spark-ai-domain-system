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

    // Get Camunda auth from header
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    const authHeader = camundaAuth ? `Basic ${camundaAuth}` : undefined;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Claim the task
    const response = await fetch(
      `${CAMUNDA_BASE_URL}/task/${params.taskId}/claim`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader }),
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Camunda API error: ${response.statusText} - ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error claiming task:', error);
    return NextResponse.json(
      { error: 'Failed to claim task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get Camunda auth from header
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    const authHeader = camundaAuth ? `Basic ${camundaAuth}` : undefined;

    // Unclaim the task
    const response = await fetch(
      `${CAMUNDA_BASE_URL}/task/${params.taskId}/unclaim`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader }),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Camunda API error: ${response.statusText} - ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unclaiming task:', error);
    return NextResponse.json(
      { error: 'Failed to unclaim task' },
      { status: 500 }
    );
  }
}