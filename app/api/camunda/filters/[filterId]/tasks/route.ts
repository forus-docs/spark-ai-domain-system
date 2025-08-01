import { NextRequest, NextResponse } from 'next/server';
import { getCamundaAuthHeader } from '@/app/lib/camunda-auth';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function POST(
  request: NextRequest,
  { params }: { params: { filterId: string } }
) {
  try {
    // Get appropriate auth header for Camunda
    const finalAuthHeader = await getCamundaAuthHeader(request);

    console.log('Filter tasks API: Auth type:', finalAuthHeader?.startsWith('Bearer') ? 'OAuth' : 'Basic');
    console.log('Filter tasks API: Filter ID:', params.filterId);

    const body = await request.json();
    const { pagination, sorting } = body;

    // Build request body for filter execution
    const requestBody: any = {};

    // Add pagination
    if (pagination) {
      const firstResult = (pagination.page - 1) * pagination.size;
      requestBody.firstResult = firstResult;
      requestBody.maxResults = pagination.size;
    }

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
      
      requestBody.sorting = [{
        sortBy: sortByMap[sorting.field] || 'created',
        sortOrder: sorting.order || 'desc'
      }];
    }

    // Fetch tasks through filter
    const response = await fetch(
      `${CAMUNDA_BASE_URL}/filter/${params.filterId}/list`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(finalAuthHeader && { 'Authorization': finalAuthHeader }),
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Filter tasks API: Camunda response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Camunda authentication failed. Please select a user.' },
          { status: 401 }
        );
      }
      
      const errorText = await response.text();
      console.error('Filter tasks API: Error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Filter tasks API: Tasks returned:', result.length);

    // Enhance tasks with process definition names if needed
    const tasks = Array.isArray(result) ? result : result._embedded?.task || [];
    
    const enhancedTasks = await Promise.all(
      tasks.map(async (task: any) => {
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
    console.error('Error in filter tasks API:', error);
    
    // More detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        // Include details in development only
        ...(process.env.NODE_ENV === 'development' && { 
          details: errorMessage,
          type: error?.constructor?.name 
        })
      },
      { status: 500 }
    );
  }
}