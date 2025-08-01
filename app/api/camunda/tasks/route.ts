import { NextRequest, NextResponse } from 'next/server';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function POST(request: NextRequest) {
  try {
    // Get Camunda auth from header
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    const authHeader = camundaAuth ? `Basic ${camundaAuth}` : undefined;

    const body = await request.json();
    const { assignee, processDefinition, searchTerm } = body.filters || {};

    // Build query parameters
    const params = new URLSearchParams({
      active: 'true',
      sortBy: 'created',
      sortOrder: 'desc',
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

    // Fetch tasks from Camunda
    const response = await fetch(`${CAMUNDA_BASE_URL}/task?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      // Check if it's an auth error
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Camunda authentication failed. Please select a user.' },
          { status: 401 }
        );
      }
      
      // Return empty array for other errors to prevent UI crashes
      console.error(`Camunda API error: ${response.statusText}`);
      return NextResponse.json([]);
    }

    const tasks = await response.json();

    // Enhance tasks with additional info if needed
    const enhancedTasks = await Promise.all(
      tasks.map(async (task: any) => {
        // Get process definition name
        const procDefResponse = await fetch(
          `${CAMUNDA_BASE_URL}/process-definition/${task.processDefinitionId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader && { 'Authorization': authHeader }),
            },
          }
        );
        
        let procDef = null;
        try {
          procDef = procDefResponse.ok ? await procDefResponse.json() : null;
        } catch (e) {
          // Ignore process definition fetch errors
          console.error('Error fetching process definition:', e);
        }

        return {
          ...task,
          processDefinitionName: procDef?.name || task.processDefinitionId,
        };
      })
    );

    return NextResponse.json(enhancedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get Camunda auth from header
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    const authHeader = camundaAuth ? `Basic ${camundaAuth}` : undefined;

    // Get process definitions for filter dropdown
    const response = await fetch(`${CAMUNDA_BASE_URL}/process-definition`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      // Return empty array for errors to prevent UI crashes
      console.error(`Camunda API error: ${response.statusText}`);
      return NextResponse.json([]);
    }

    const processDefinitions = await response.json();

    // Get unique process definitions by key
    const uniqueDefinitions = processDefinitions.reduce((acc: any[], def: any) => {
      if (!acc.find((d) => d.key === def.key)) {
        acc.push({
          key: def.key,
          name: def.name || def.key,
        });
      }
      return acc;
    }, []);

    return NextResponse.json(uniqueDefinitions);
  } catch (error) {
    console.error('Error fetching process definitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch process definitions' },
      { status: 500 }
    );
  }
}