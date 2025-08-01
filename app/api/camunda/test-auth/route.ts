import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const camundaAuth = request.headers.get('X-Camunda-Auth');
  
  if (camundaAuth) {
    const decoded = atob(camundaAuth);
    const [username, password] = decoded.split(':');
    
    // Test the auth directly with Camunda
    const response = await fetch('http://localhost:8080/engine-rest/task?active=true', {
      headers: {
        'Authorization': `Basic ${camundaAuth}`
      }
    });
    
    const tasks = await response.json();
    
    return NextResponse.json({
      authReceived: true,
      username,
      camundaStatus: response.status,
      taskCount: Array.isArray(tasks) ? tasks.length : 0,
      tasks: tasks
    });
  }
  
  return NextResponse.json({
    authReceived: false,
    message: 'No X-Camunda-Auth header found'
  });
}