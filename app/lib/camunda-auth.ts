import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { NextRequest } from 'next/server';

/**
 * Get the appropriate authentication header for Camunda API calls.
 * Prioritizes OAuth tokens from Keycloak session, falls back to Basic Auth for development.
 */
export async function getCamundaAuthHeader(request: NextRequest): Promise<string> {
  // Try to get OAuth token from session first
  const session = await getServerSession(authOptions);
  
  // Get auth from headers
  const authHeader = request.headers.get('Authorization');
  const camundaAuth = request.headers.get('X-Camunda-Auth');
  
  // Determine final auth header - prefer OAuth token from session
  if (session?.accessToken) {
    // Use OAuth token from Keycloak session
    return `Bearer ${session.accessToken}`;
  } else if (authHeader) {
    // Use provided Authorization header
    return authHeader;
  } else if (camundaAuth) {
    // Fall back to Basic Auth for development
    return `Basic ${camundaAuth}`;
  }
  
  return '';
}

/**
 * Check if we're using Keycloak authentication
 */
export function isKeycloakEnabled(): boolean {
  return process.env.USE_KEYCLOAK === 'true' || process.env.NEXT_PUBLIC_USE_KEYCLOAK === 'true';
}