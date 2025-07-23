import { connectToDatabase } from '../app/lib/database';
import Domain from '../app/models/Domain';
import { mockDomains } from '../app/lib/mock-data';
import mongoose from 'mongoose';

async function migrateDomains() {
  try {
    await connectToDatabase();
    
    console.log('🚀 Starting domain migration...');

    // Clear existing domains
    await Domain.deleteMany({});
    console.log('✅ Cleared existing domains');
    
    // Process each domain
    for (const mockDomain of mockDomains) {
      console.log(`\n📦 Migrating domain: ${mockDomain.name}`);
      
      // Convert mock data to Domain model format
      const domainData = {
        domainId: mockDomain.id,
        name: mockDomain.name,
        description: mockDomain.description,
        icon: mockDomain.icon,
        color: mockDomain.color,
        tagline: mockDomain.tagline,
        gradient: mockDomain.gradient,
        cta: mockDomain.cta,
        joinDetails: mockDomain.joinDetails,
        memberCount: mockDomain.memberCount,
        availableRoles: mockDomain.roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          monthlyFee: parseFloat(role.price.replace(/[^\d.]/g, '')), // Convert "10 USD" or "1,000 USD" to number
          benefits: role.benefits
        })),
        features: getFeaturesByDomain(mockDomain.id),
        processes: [], // Will be populated by process migration
        navigation: getNavigationItemsForDomain(mockDomain.id),
        region: mockDomain.region,
        active: true
      };
      
      const domain = await Domain.create(domainData);
      console.log(`✅ Created domain: ${domain.name} (${domain.domainId})`);
      
      // Log role count
      console.log(`   - ${domain.availableRoles.length} roles configured`);
      console.log(`   - ${domain.navigation.length} navigation items`);
    }
    
    // Display summary
    const domainCount = await Domain.countDocuments();
    console.log(`\n✅ Migration complete!`);
    console.log(`📊 Total domains migrated: ${domainCount}`);
    
    // Show domain details
    const domains = await Domain.find();
    console.log('\n📋 Domain Summary:');
    for (const domain of domains) {
      console.log(`  - ${domain.name} (${domain.domainId})`);
      console.log(`    Roles: ${domain.availableRoles.map((r: any) => r.name).join(', ')}`);
      console.log(`    Members: ${domain.memberCount}`);
      console.log(`    Region: ${domain.region}`);
    }

  } catch (error) {
    console.error('❌ Error migrating domains:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get navigation items based on domain
function getNavigationItemsForDomain(domainId: string): any[] {
  const commonItems = [
    { id: 'domains', icon: '🌐', name: 'Domains', href: '/domains' },
    { id: 'dashboards', icon: '📊', name: 'Dashboards', href: '/dashboards' },
    { id: 'tasks', icon: '✅', name: 'Tasks', href: '/tasks' },
    { id: 'procedures', icon: '📋', name: 'Procedures', href: '/procedures' },
    { id: 'workstreams', icon: '🔄', name: 'Workstreams', href: '/workstreams' },
    { id: 'teams', icon: '👥', name: 'Teams', href: '/teams' },
    { id: 'organogram', icon: '🏢', name: 'Organogram', href: '/organogram' },
  ];
  
  // Add domain-specific items
  const domainSpecificItems: Record<string, any[]> = {
    'maven-hub': [
      { id: 'opportunities', icon: '💎', name: 'Opportunities', href: '/opportunities' },
      { id: 'portfolio', icon: '📈', name: 'Portfolio', href: '/portfolio' }
    ],
    'wealth-on-wheels': [
      { id: 'fleet', icon: '🚗', name: 'Fleet', href: '/fleet' },
      { id: 'routes', icon: '🗺️', name: 'Routes', href: '/routes' }
    ],
    'bemnet': [
      { id: 'wallet', icon: '💳', name: 'Wallet', href: '/wallet' },
      { id: 'credit', icon: '📊', name: 'Credit', href: '/credit' }
    ],
    'pacci': [
      { id: 'trade', icon: '🤝', name: 'Trade', href: '/trade' },
      { id: 'certificates', icon: '📜', name: 'Certificates', href: '/certificates' }
    ]
  };
  
  return [...commonItems, ...(domainSpecificItems[domainId] || [])];
}

// Get features based on domain
function getFeaturesByDomain(domainId: string): string[] {
  const features: Record<string, string[]> = {
    'maven-hub': [
      'Access to vetted investment opportunities',
      'Global investor network',
      'Due diligence tools',
      'Revenue share in MHX tokens'
    ],
    'wealth-on-wheels': [
      'Fleet management dashboard',
      'Real-time GPS tracking',
      'Digital payment processing',
      'Driver performance analytics'
    ],
    'bemnet': [
      'Blockchain-secured savings',
      'Credit history building',
      'Digital wallet',
      'Peer-to-peer lending'
    ],
    'pacci': [
      'Continental trade access',
      'AfCFTA certification',
      'B2B networking',
      'Business directory listing'
    ]
  };
  
  return features[domainId] || [];
}

// Run the migration
migrateDomains();