import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import Domain from '@/app/models/Domain';

export const dynamic = 'force-dynamic';

/**
 * GET /api/domains
 * 
 * Fetches all active domains from MongoDB
 * No authentication required as domains are public
 */
export async function GET() {
  try {
    console.log('Domains API called');
    const db = await connectToDatabase();
    console.log('Current database:', db.connection.db?.databaseName);

    // Fetch all active domains
    const domains = await Domain.find({ active: true })
      .select('-__v') // Exclude version key
      .sort({ domainId: 1 });
    
    console.log('Found domains:', domains.length);

    // Transform MongoDB documents to match frontend expectations
    const transformedDomains = domains.map(domain => ({
      id: domain.domainId,
      icon: domain.icon,
      name: domain.name,
      tagline: domain.tagline || '', // Add if missing
      description: domain.description,
      cta: domain.cta || `Join ${domain.name}`, // Default CTA
      region: domain.region || 'Global',
      color: domain.color,
      gradient: domain.gradient || `from-${domain.color}-600 to-${domain.color}-400`, // Generate gradient if missing
      hasExistingMembers: domain.memberCount > 0,
      memberCount: domain.memberCount,
      joinDetails: domain.joinDetails || {}, // Add if missing
      roles: domain.availableRoles.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        price: `${role.monthlyFee} USD`, // Convert number to string format
        isDefault: role.id === 'visitor', // Visitor is default for Maven Hub
        benefits: role.benefits || []
      })),
      availableRoles: domain.availableRoles.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        price: `${role.monthlyFee} USD`,
        isDefault: role.id === 'visitor',
        benefits: role.benefits || []
      }))
    }));

    return NextResponse.json({
      domains: transformedDomains,
      success: true
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains', success: false },
      { status: 500 }
    );
  }
}