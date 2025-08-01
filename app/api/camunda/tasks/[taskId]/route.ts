import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function GET(
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

    // Get task details
    const taskResponse = await fetch(
      `${CAMUNDA_BASE_URL}/task/${params.taskId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!taskResponse.ok) {
      throw new Error(`Camunda API error: ${taskResponse.statusText}`);
    }

    const task = await taskResponse.json();

    // Get task variables
    const variablesResponse = await fetch(
      `${CAMUNDA_BASE_URL}/task/${params.taskId}/variables`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const variables = variablesResponse.ok ? await variablesResponse.json() : {};

    // Get form key
    const formResponse = await fetch(
      `${CAMUNDA_BASE_URL}/task/${params.taskId}/form`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const form = formResponse.ok ? await formResponse.json() : null;

    // Get process instance info
    const processResponse = await fetch(
      `${CAMUNDA_BASE_URL}/process-instance/${task.processInstanceId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const processInstance = processResponse.ok ? await processResponse.json() : null;

    return NextResponse.json({
      task,
      variables,
      form,
      processInstance,
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task details' },
      { status: 500 }
    );
  }
}