import { NextRequest, NextResponse } from 'next/server';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function GET(request: NextRequest) {
  try {
    // Get auth from header - supports both Basic and Bearer
    const authHeader = request.headers.get('Authorization');
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    
    // Prefer Authorization header (Bearer token) over X-Camunda-Auth (Basic)
    let finalAuthHeader = authHeader;
    if (!finalAuthHeader && camundaAuth) {
      finalAuthHeader = `Basic ${camundaAuth}`;
    }

    console.log('Filters API: Auth type:', finalAuthHeader?.startsWith('Bearer') ? 'OAuth' : 'Basic');

    // Fetch filters from Camunda
    const response = await fetch(`${CAMUNDA_BASE_URL}/filter`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(finalAuthHeader && { 'Authorization': finalAuthHeader }),
      },
    });

    console.log('Filters API: Camunda response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Camunda authentication failed. Please select a user.' },
          { status: 401 }
        );
      }
      
      console.error(`Camunda API error: ${response.statusText}`);
      return NextResponse.json([]);
    }

    const filters = await response.json();
    console.log('Filters API: Filters returned:', filters.length);

    // Only return task filters
    const taskFilters = filters.filter((filter: any) => filter.resourceType === 'Task');

    // Sort by priority if available
    taskFilters.sort((a: any, b: any) => {
      const aPriority = a.properties?.priority || 999;
      const bPriority = b.properties?.priority || 999;
      return aPriority - bPriority;
    });

    return NextResponse.json(taskFilters);
  } catch (error) {
    console.error('Error in filters API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}