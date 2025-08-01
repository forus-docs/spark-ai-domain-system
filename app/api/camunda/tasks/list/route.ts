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
    
    console.log('API: Auth type:', finalAuthHeader?.startsWith('Bearer') ? 'OAuth' : 'Basic');
    if (finalAuthHeader?.startsWith('Basic')) {
      const base64 = finalAuthHeader.split(' ')[1];
      const decoded = atob(base64);
      console.log('API: Auth user:', decoded.split(':')[0]);
    }

    const body = await request.json();
    const { filters, sorting, pagination } = body;
    const { assignee, processDefinition, searchTerm } = filters || {};

    // Build query parameters
    const params = new URLSearchParams({
      active: 'true',
    });

    // Add sorting
    if (sorting) {
      const sortByMap: Record<string, string> = {
        created: 'created',
        due: 'dueDate',
        followUp: 'followUpDate',
        priority: 'priority',
        name: 'name',
        assignee: 'assignee',
      };
      
      const camundaSortBy = sortByMap[sorting.field] || 'created';
      params.append('sortBy', camundaSortBy);
      params.append('sortOrder', sorting.order);
    } else {
      params.append('sortBy', 'created');
      params.append('sortOrder', 'desc');
    }

    // Add pagination
    if (pagination) {
      const firstResult = (pagination.page - 1) * pagination.size;
      params.append('firstResult', String(firstResult));
      params.append('maxResults', String(pagination.size));
    }

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
    console.log('API: Fetching tasks from:', `${CAMUNDA_BASE_URL}/task?${params}`);
    console.log('API: Auth header:', finalAuthHeader ? 'Present' : 'Missing');
    
    const response = await fetch(`${CAMUNDA_BASE_URL}/task?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(finalAuthHeader && { 'Authorization': finalAuthHeader }),
      },
    });

    console.log('API: Camunda response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Camunda authentication failed. Please select a user.' },
          { status: 401 }
        );
      }
      
      console.error(`Camunda API error: ${response.statusText}`);
      const errorText = await response.text();
      console.error('API: Error response:', errorText);
      return NextResponse.json([]);
    }

    const tasks = await response.json();
    console.log('API: Tasks returned:', tasks.length);

    // Enhance tasks with additional info if needed
    const enhancedTasks = await Promise.all(
      tasks.map(async (task: any) => {
        // Get process definition name if not already present
        if (!task.processDefinitionName && task.processDefinitionId) {
          try {
            const defResponse = await fetch(
              `${CAMUNDA_BASE_URL}/process-definition/${task.processDefinitionId}`,
              {
                headers: {
                  ...(finalAuthHeader && { 'Authorization': finalAuthHeader }),
                },
              }
            );
            
            if (defResponse.ok) {
              const definition = await defResponse.json();
              task.processDefinitionName = definition.name || definition.key;
            }
          } catch (error) {
            // Ignore errors for process definition fetch
          }
        }

        return {
          id: task.id,
          name: task.name,
          assignee: task.assignee,
          created: task.created,
          due: task.due,
          followUp: task.followUp,
          priority: task.priority,
          processDefinitionId: task.processDefinitionId,
          processDefinitionName: task.processDefinitionName,
          processInstanceId: task.processInstanceId,
          taskDefinitionKey: task.taskDefinitionKey,
          description: task.description,
        };
      })
    );

    return NextResponse.json(enhancedTasks);
  } catch (error) {
    console.error('Error in task list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}