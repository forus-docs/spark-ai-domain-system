import { NextRequest, NextResponse } from 'next/server';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function POST(request: NextRequest) {
  try {
    // Get Camunda auth from header
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    
    if (!camundaAuth) {
      return NextResponse.json(
        { error: 'No authentication provided' },
        { status: 401 }
      );
    }

    const authHeader = `Basic ${camundaAuth}`;
    
    // Try a simple API call to verify auth works
    // Using task count as it's lightweight and requires auth
    const response = await fetch(`${CAMUNDA_BASE_URL}/task/count`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ 
        authenticated: true,
        count: data.count 
      });
    } else if (response.status === 401) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'Authentication check failed' 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Failed to verify authentication' 
      },
      { status: 500 }
    );
  }
}