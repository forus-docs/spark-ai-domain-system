import { NextRequest, NextResponse } from 'next/server';

const CAMUNDA_BASE_URL = 'http://localhost:8080/engine-rest';

export async function GET(
  request: NextRequest,
  { params }: { params: { filterId: string } }
) {
  try {
    // Get auth from header - supports both Basic and Bearer
    const authHeader = request.headers.get('Authorization');
    const camundaAuth = request.headers.get('X-Camunda-Auth');
    
    // Prefer Authorization header (Bearer token) over X-Camunda-Auth (Basic)
    let finalAuthHeader = authHeader;
    if (!finalAuthHeader && camundaAuth) {
      finalAuthHeader = `Basic ${camundaAuth}`;
    }

    console.log('Filter count API: Auth type:', finalAuthHeader?.startsWith('Bearer') ? 'OAuth' : 'Basic');
    console.log('Filter count API: Filter ID:', params.filterId);

    // Fetch task count through filter
    const response = await fetch(
      `${CAMUNDA_BASE_URL}/filter/${params.filterId}/count`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(finalAuthHeader && { 'Authorization': finalAuthHeader }),
        },
      }
    );

    console.log('Filter count API: Camunda response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Camunda authentication failed. Please select a user.' },
          { status: 401 }
        );
      }
      
      const errorText = await response.text();
      console.error('Filter count API: Error response:', errorText);
      return NextResponse.json(
        { count: 0 },
        { status: 200 } // Return 0 count on error instead of failing
      );
    }

    const result = await response.json();
    console.log('Filter count API: Count:', result.count);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in filter count API:', error);
    return NextResponse.json(
      { count: 0 },
      { status: 200 } // Return 0 count on error instead of failing
    );
  }
}