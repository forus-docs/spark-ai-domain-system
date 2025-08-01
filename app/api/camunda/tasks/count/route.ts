import { NextRequest, NextResponse } from 'next/server';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function POST(request: NextRequest) {
  try {
    // Get auth from header - supports both Basic and Bearer
    const authHeader = request.headers.get('Authorization');
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    
    // Prefer Authorization header (Bearer token) over X-Camunda-Auth (Basic)
    let finalAuthHeader = authHeader;
    if (!finalAuthHeader && camundaAuth) {
      finalAuthHeader = `Basic ${camundaAuth}`;
    }

    const body = await request.json();
    const { filters } = body;
    const { assignee, processDefinition, searchTerm } = filters || {};

    // Build query parameters for count
    const params = new URLSearchParams({
      active: 'true',
    });

    // Add filters
    if (assignee === 'me' && body.currentUser) {
      params.append('assignee', body.currentUser);
    } else if (assignee === 'unassigned') {
      params.append('unassigned', 'true');
    }

    if (processDefinition && processDefinition !== 'all') {
      params.append('processDefinitionKey', processDefinition);
    }

    if (searchTerm) {
      params.append('nameLike', `%${searchTerm}%`);
    }

    // Get task count from Camunda
    const response = await fetch(`${CAMUNDA_BASE_URL}/task/count?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(finalAuthHeader && { 'Authorization': finalAuthHeader }),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Camunda authentication failed. Please select a user.' },
          { status: 401 }
        );
      }
      
      console.error(`Camunda API error: ${response.statusText}`);
      return NextResponse.json({ count: 0 });
    }

    const data = await response.json();
    return NextResponse.json({ count: data.count });
  } catch (error) {
    console.error('Error in task count API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}