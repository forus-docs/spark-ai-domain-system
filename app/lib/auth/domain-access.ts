import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';

export interface DomainAccessCheck {
  isValid: boolean;
  userId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Verify that a user has access to a specific domain
 */
export async function verifyDomainAccess(
  request: NextRequest,
  domainId: string
): Promise<DomainAccessCheck> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'No authorization token provided',
        statusCode: 401
      };
    }

    const token = authHeader.split(' ')[1];
    
    let userId: string;
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded.id;
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid or expired token',
        statusCode: 401
      };
    }

    // Connect to database
    await connectToDatabase();

    // Check if user exists and has access to the domain
    const user = await User.findById(userId).select('domains');
    
    if (!user) {
      return {
        isValid: false,
        error: 'User not found',
        statusCode: 404
      };
    }

    // Check if user is a member of the requested domain
    const hasDomainAccess = user.domains?.some(
      (domain: any) => domain.domainId === domainId
    );

    if (!hasDomainAccess) {
      return {
        isValid: false,
        error: 'Access denied. You are not a member of this domain.',
        statusCode: 403
      };
    }

    return {
      isValid: true,
      userId
    };
  } catch (error) {
    console.error('Error verifying domain access:', error);
    return {
      isValid: false,
      error: 'Internal server error',
      statusCode: 500
    };
  }
}

/**
 * Create a standard unauthorized response
 */
export function createUnauthorizedResponse(error: string, statusCode: number = 401) {
  return NextResponse.json({ error }, { status: statusCode });
}