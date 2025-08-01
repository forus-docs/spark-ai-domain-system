import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
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
  domainId: string
): Promise<DomainAccessCheck> {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return {
        isValid: false,
        error: 'No authorization token provided',
        statusCode: 401
      };
    }

    const userId = session.user.id;

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