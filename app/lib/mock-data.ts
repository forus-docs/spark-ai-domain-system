import { Domain, User, UserDomainMembership, RecentItem } from '@/app/types/domain.types';

export const mockDomains: Domain[] = [
  {
    id: 'maven-hub',
    slug: 'maven-hub',
    icon: '🌐',
    name: 'Maven Hub',
    tagline: 'Global Investment Network',
    description: 'Where 2,500+ global investors create exponential value together. Every new Maven multiplies opportunities for all.',
    cta: 'Join the network that grows your wealth',
    region: 'Global',
    color: '#7C3AED',
    gradient: 'from-purple-600 to-yellow-500',
    hasExistingMembers: true,
    memberCount: 2500,
    joinDetails: {
      minInvestment: '10 USD',
      minimumInvestment: '10,000 USD',
      benefit: 'Revenue Share: MahalaX tokens',
    },
    roles: [
      {
        id: 'visitor',
        name: 'Visitor',
        description: 'I want to explore Maven Hub before committing',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'Join 2,500+ investors exploring new opportunities',
          'Preview live deals flowing through the network',
          'Learn from successful Maven investment strategies',
          'Test-drive the platform risk-free for 30 days'
        ]
      },
      {
        id: 'maven',
        name: 'Maven',
        description: 'I want to become a full Maven',
        price: '1,000 USD',
        benefits: [
          'Co-invest alongside 2,500 proven Mavens globally',
          'List your projects and tap into collective funding power',
          'Earn MHX rewards as the network creates value',
          'Shape the future of decentralized investment'
        ]
      },
      {
        id: 'existing_maven',
        name: 'Existing Maven',
        description: 'I\'m already a Maven',
        price: '10 USD',
        benefits: [
          'Reconnect with your Maven network instantly',
          'Access enhanced features built by the community',
          'Continue growing your investment portfolio',
          'Claim your MHX rewards from network growth'
        ]
      },
      {
        id: 'investor_only',
        name: 'Investor Only',
        description: 'I will use the app to monitor activity and watch my investment grow',
        price: '10 USD',
        benefits: [
          'Watch your MHX value grow with network expansion',
          'Track real-time performance of Maven investments',
          'Monitor portfolio growth powered by collective success',
          'Join as Maven when you see the network\'s power'
        ]
      }
    ],
    availableRoles: []
  },
  {
    id: 'wealth-on-wheels',
    slug: 'wealth-on-wheels',
    icon: '🚖',
    name: 'Wealth on Wheels',
    tagline: 'Siyabangena - Digital Transport Revolution',
    description: 'Where taxi owners unite to cut costs by 40% and boost revenue by 30%. Network power transforms individual struggles into collective success.',
    cta: 'Join forces, multiply your fleet\'s value',
    region: 'Eastern Cape, South Africa',
    color: '#F97316',
    gradient: 'from-orange-500 to-green-500',
    hasExistingMembers: false,
    memberCount: 150,
    joinDetails: {
      minInvestment: '10 USD',
      benefit: 'Digital tools for your transport needs',
    },
    roles: [
      {
        id: 'visitor',
        name: 'Visitor',
        description: 'I want to explore Wealth on Wheels before committing',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'Join 150+ operators transforming transport together',
          'See how digital tools increase fleet revenue by 30%',
          'Learn from successful taxi digitization stories',
          'Experience the platform free for 30 days'
        ]
      },
      {
        id: 'taxi_owner',
        name: 'Taxi Owner',
        description: 'I own taxis and want to digitize my operations',
        price: '50 USD',
        benefits: [
          'Join a network reducing operational costs by 40%',
          'GPS tracking shared across the owner community',
          'Collective bargaining power for fuel and insurance',
          'Revenue grows as more owners join the network'
        ]
      },
      {
        id: 'taxi_association',
        name: 'Taxi Association',
        description: 'We manage multiple taxi owners and fleets',
        price: '200 USD',
        benefits: [
          'Unite your members in a powerful digital ecosystem',
          'Network-wide analytics improve entire routes',
          'Standardized compliance benefits all members',
          'Association growth directly increases member value'
        ]
      },
      {
        id: 'driver',
        name: 'Driver',
        description: 'I drive taxis and want fair employment terms',
        price: '10 USD',
        benefits: [
          'Join 1000+ drivers earning fairly together',
          'Transparent commission system benefits everyone',
          'Safety network protects all drivers collectively',
          'Performance rewards grow with network success'
        ]
      },
      {
        id: 'existing_member',
        name: 'Existing Member',
        description: 'I\'m already part of Wealth on Wheels',
        price: '10 USD',
        benefits: [
          'Reconnect with your transport network',
          'Access new features built by the community',
          'Continue benefiting from network growth',
          'Help onboard new members and grow together'
        ]
      }
    ],
    availableRoles: []
  },
  {
    id: 'bemnet',
    slug: 'bemnet',
    icon: '💰',
    name: 'Bemnet',
    tagline: 'Financial Inclusion on a Trusted Network',
    description: 'Where 500+ members prove that together we bank. Group savings achieve 3x higher success. Your network is your net worth.',
    cta: 'Join the wealth-building movement',
    region: 'Ethiopia',
    color: '#0EA5E9',
    gradient: 'from-blue-500 to-cyan-400',
    hasExistingMembers: false,
    memberCount: 500,
    joinDetails: {
      minInvestment: '10 USD',
      benefit: 'Instant credit line',
    },
    roles: [
      {
        id: 'visitor',
        name: 'Visitor',
        description: 'I want to explore Bemnet before committing',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'Join 500+ members building wealth together',
          'See how group savings multiply individual power',
          'Learn from community financial success stories',
          'Try the platform free for 30 days'
        ]
      },
      {
        id: 'saver',
        name: 'Saver',
        description: 'I want to save money and build credit history',
        price: '10 USD',
        benefits: [
          'Your savings secured by 500+ member network',
          'Build credit faster through community validation',
          'Group savings goals achieve 3x higher success',
          'Earn rewards as the savings network grows'
        ]
      },
      {
        id: 'merchant',
        name: 'Merchant',
        description: 'I run a business and want to accept digital payments',
        price: '25 USD',
        benefits: [
          'Tap into 500+ member customer network instantly',
          'Payment volume grows with network expansion',
          'Shared customer insights boost all merchants',
          'Access community-funded working capital'
        ]
      },
      {
        id: 'micro_lender',
        name: 'Micro Lender',
        description: 'I want to provide loans and earn returns',
        price: '100 USD',
        benefits: [
          'Lend to pre-verified community members',
          'Risk pooled across the lending network',
          'Returns increase as network creditworthiness improves',
          'Shape financial inclusion for thousands'
        ]
      },
      {
        id: 'existing_member',
        name: 'Existing Member',
        description: 'I\'m already a Bemnet member',
        price: '10 USD',
        benefits: [
          'Rejoin your financial empowerment network',
          'Access new wealth-building tools from community',
          'Continue your journey with enhanced benefits',
          'Help grow the network that grows your wealth'
        ]
      }
    ],
    availableRoles: []
  },
  {
    id: 'pacci',
    slug: 'pacci',
    icon: '🤝',
    name: 'PACCI',
    tagline: 'Pan African Chamber of Commerce and Industry',
    description: 'Where 1,200+ businesses unlock $3 trillion in African trade. Every connection opens doors for the entire network. Unity is prosperity.',
    cta: 'Trade across Africa, grow together',
    region: 'Pan-African',
    color: '#16A34A',
    gradient: 'from-green-600 via-yellow-500 to-red-600',
    hasExistingMembers: false,
    memberCount: 1200,
    joinDetails: {
      minInvestment: '10 USD',
      benefit: 'AfCFTA certification',
    },
    roles: [
      {
        id: 'visitor',
        name: 'Visitor',
        description: 'I want to explore PACCI before committing',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'Join 1,200+ businesses trading across 54 countries',
          'Preview $2B+ in active trade opportunities',
          'Learn how AfCFTA multiplies business growth',
          'Explore the network free for 30 days'
        ]
      },
      {
        id: 'business_member',
        name: 'Business Member',
        description: 'I run a business and want to trade across Africa',
        price: '50 USD',
        benefits: [
          'Access 1.3 billion consumer market together',
          'AfCFTA benefits multiply with each new member',
          'Find trusted partners in 54 African countries',
          'Trade finance pool grows with network expansion'
        ]
      },
      {
        id: 'chamber_member',
        name: 'Chamber Member',
        description: 'We are a chamber of commerce joining the network',
        price: '500 USD',
        benefits: [
          'Connect your members to continental opportunities',
          'Cross-chamber partnerships amplify member success',
          'Collective advocacy shapes trade policy',
          'Network growth directly benefits your members'
        ]
      },
      {
        id: 'trade_facilitator',
        name: 'Trade Facilitator',
        description: 'I help businesses with import/export and logistics',
        price: '100 USD',
        benefits: [
          'Service 1,200+ pre-verified businesses',
          'Shared logistics networks reduce costs 50%',
          'Standardized processes benefit all facilitators',
          'Revenue grows exponentially with trade volume'
        ]
      },
      {
        id: 'existing_member',
        name: 'Existing Member',
        description: 'I\'m already a PACCI member',
        price: '10 USD',
        benefits: [
          'Reconnect with your continental trade network',
          'Access powerful new tools built by members',
          'Continue expanding your African footprint',
          'Help onboard others and strengthen the network'
        ]
      }
    ],
    availableRoles: []
  }
];

// Set availableRoles to be the same as roles for each domain
mockDomains.forEach(domain => {
  domain.availableRoles = domain.roles;
});

export const mockUser: User = {
  id: 'user-1',
  name: 'Jacques',
  email: 'jacques@example.com',
  plan: 'max'
};

export const mockUserMemberships: UserDomainMembership[] = [];

export const mockRecentItems: Record<string, RecentItem[]> = {
  'maven-hub': [
    {
      icon: '📊',
      title: 'Investment Analytics',
      description: 'Q1 portfolio performance review showing 15% growth',
      timestamp: '2 hours ago',
      section: 'dashboards'
    },
    {
      icon: '✅',
      title: 'Due Diligence Review',
      description: 'Tech startup evaluation pending your approval',
      timestamp: '3 hours ago',
      section: 'tasks'
    },
    {
      icon: '🔄',
      title: 'Deal Flow Pipeline',
      description: 'New solar energy project from Kenya',
      timestamp: '5 hours ago',
      section: 'workstreams'
    }
  ],
  'wealth-on-wheels': [
    {
      icon: '📊',
      title: 'Fleet Performance',
      description: 'Weekly route optimization saved 12% on fuel',
      timestamp: '1 hour ago',
      section: 'dashboards'
    },
    {
      icon: '✅',
      title: 'Driver Onboarding',
      description: '15 new drivers pending verification',
      timestamp: '4 hours ago',
      section: 'tasks'
    },
    {
      icon: '👥',
      title: 'Cooperative Meeting',
      description: 'Monthly revenue sharing discussion',
      timestamp: '6 hours ago',
      section: 'teams'
    }
  ],
  'bemnet': [
    {
      icon: '💰',
      title: 'Savings Dashboard',
      description: 'Monthly savings goal 80% achieved',
      timestamp: '2 hours ago',
      section: 'dashboards'
    },
    {
      icon: '📋',
      title: 'Credit Application',
      description: 'New loan request for small business',
      timestamp: '5 hours ago',
      section: 'procedures'
    },
    {
      icon: '🔄',
      title: 'Payment Processing',
      description: 'Digital wallet top-up completed',
      timestamp: '7 hours ago',
      section: 'workstreams'
    }
  ],
  'pacci': [
    {
      icon: '🤝',
      title: 'Trade Opportunities',
      description: 'New B2B connections from Nigeria',
      timestamp: '1 hour ago',
      section: 'workstreams'
    },
    {
      icon: '📊',
      title: 'Export Analytics',
      description: 'Cross-border trade volume up 25%',
      timestamp: '3 hours ago',
      section: 'dashboards'
    },
    {
      icon: '📋',
      title: 'AfCFTA Documentation',
      description: 'Certificate renewal process started',
      timestamp: '4 hours ago',
      section: 'procedures'
    }
  ],
  default: [
    {
      icon: '🌐',
      title: 'Welcome to Spark AI',
      description: 'Explore domains to get started',
      timestamp: '1 hour ago',
      section: 'domains'
    },
    {
      icon: '📚',
      title: 'Getting Started Guide',
      description: 'Learn how to join your first domain',
      timestamp: '2 hours ago',
      section: 'domains'
    }
  ]
};

export const getDomainById = (id: string): Domain | undefined => {
  return mockDomains.find(domain => domain.id === id);
};

export const getRecentItemsForDomain = (domainId: string | null): RecentItem[] => {
  if (!domainId) return mockRecentItems.default;
  return mockRecentItems[domainId] || mockRecentItems.default;
};

export const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 300));