// Mock data for Phase 1 implementation
// This file provides all the mock data needed for the application

import { Domain, User, UserDomainMembership, RecentItem } from './types/domain.types';

export const mockDomains: Domain[] = [
  {
    id: 'maven',
    icon: '🌐',
    name: 'Maven Hub',
    tagline: 'Global Investment Network',
    cta: 'Join 2,500 investors shaping the future',
    region: 'Global',
    color: '#7C3AED',
    gradient: 'from-purple-600 to-yellow-500',
    hasExistingMembers: true,
    joinDetails: {
      minInvestment: '10 USD',
      minimumInvestment: '10,000 USD',
      benefit: 'Revenue Share: MahalaX tokens',
    },
    roles: [
      {
        id: 'investor',
        name: 'Investor',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'Access to vetted investment deals',
          'Monthly revenue share in MHX',
          'Connect with global investors',
          'Exclusive project funding access'
        ]
      },
      {
        id: 'project_owner',
        name: 'Project Owner',
        price: '10 USD',
        benefits: [
          'List your project for funding',
          'Access to investor network',
          'Project promotion tools',
          'Due diligence support'
        ]
      },
      {
        id: 'advisor',
        name: 'Investment Advisor',
        price: '10 USD',
        benefits: [
          'Advise on investment deals',
          'Earn advisory fees',
          'Build reputation score',
          'Access to deal flow'
        ]
      }
    ]
  },
  {
    id: 'wow',
    icon: '🚖',
    name: 'Wealth on Wheels',
    tagline: 'Siyabangena - Digital Transport Revolution',
    cta: 'Join the transport ecosystem transformation',
    region: 'Eastern Cape, South Africa',
    color: '#F97316',
    gradient: 'from-orange-500 to-green-500',
    hasExistingMembers: false,
    joinDetails: {
      minInvestment: '10 USD',
      benefit: 'Digital tools for your transport needs',
    },
    roles: [
      {
        id: 'cooperative',
        name: 'Cooperative',
        price: '10 USD',
        benefits: [
          'Multi-fleet management dashboard',
          'Revenue analytics & reporting',
          'Compliance tracking tools',
          'Bulk driver onboarding'
        ]
      },
      {
        id: 'operator',
        name: 'Operator',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'GPS tracking for your vehicles',
          'Digital payment processing',
          'Driver performance monitoring',
          'Fuel rebate management'
        ]
      },
      {
        id: 'driver',
        name: 'Driver',
        price: '10 USD',
        benefits: [
          'Employment contract & benefits',
          'Fair commission structure',
          'Safety monitoring & support',
          'Performance-based incentives'
        ]
      },
      {
        id: 'commuter',
        name: 'Commuter',
        price: '10 USD',
        benefits: [
          'Cashless payment options',
          'Real-time vehicle tracking',
          'Safety features & alerts',
          'Loyalty rewards program'
        ]
      }
    ]
  },
  {
    id: 'bemnet',
    icon: '💰',
    name: 'Bemnet',
    tagline: 'Financial Inclusion on a Trusted Network',
    cta: 'Build your financial future on blockchain',
    region: 'Ethiopia',
    color: '#0EA5E9',
    gradient: 'from-blue-500 to-cyan-400',
    hasExistingMembers: false,
    joinDetails: {
      minInvestment: '10 USD',
      benefit: 'Instant credit line',
    },
    roles: [
      {
        id: 'member',
        name: 'Member',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'Blockchain-secured savings',
          'Build credit history',
          'Revenue sharing model',
          'Digital payment wallet'
        ]
      },
      {
        id: 'merchant',
        name: 'Merchant',
        price: '10 USD',
        benefits: [
          'Accept digital payments',
          'Business analytics dashboard',
          'Customer loyalty tools',
          'Inventory financing access'
        ]
      },
      {
        id: 'lender',
        name: 'Community Lender',
        price: '10 USD',
        benefits: [
          'Peer-to-peer lending platform',
          'Risk assessment tools',
          'Automated repayment tracking',
          'Interest income opportunities'
        ]
      }
    ]
  },
  {
    id: 'pacci',
    icon: '🤝',
    name: 'PACCI',
    tagline: 'Pan African Chamber of Commerce and Industry',
    cta: 'Connect with 50+ chambers across Africa',
    region: 'Pan-African',
    color: '#16A34A',
    gradient: 'from-green-600 via-yellow-500 to-red-600',
    hasExistingMembers: false,
    joinDetails: {
      minInvestment: '10 USD',
      benefit: 'AfCFTA certification',
    },
    roles: [
      {
        id: 'business',
        name: 'Business Member',
        price: '10 USD',
        isDefault: true,
        benefits: [
          'Continental trade access',
          'Business directory listing',
          'Policy advocacy support',
          'B2B networking events'
        ]
      },
      {
        id: 'chamber',
        name: 'Chamber Organization',
        price: '10 USD',
        benefits: [
          'Member management tools',
          'Event hosting platform',
          'Cross-chamber collaboration',
          'Policy influence network'
        ]
      },
      {
        id: 'government',
        name: 'Government Partner',
        price: '10 USD',
        benefits: [
          'Trade policy insights',
          'Business ecosystem data',
          'Direct chamber communication',
          'Economic development tools'
        ]
      }
    ]
  }
];

export const mockUser: User = {
  id: 'user-1',
  name: 'Jacques',
  email: 'jacques@example.com',
  plan: 'max'
};

export const mockUserMemberships: UserDomainMembership[] = [
  // Start with empty array - user hasn't joined any domains yet
];

export const mockRecentItems: Record<string, RecentItem[]> = {
  maven: [
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
  wow: [
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
  bemnet: [
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
  pacci: [
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

// Helper function to get domain by ID
export const getDomainById = (id: string): Domain | undefined => {
  return mockDomains.find(domain => domain.id === id);
};

// Helper function to get recent items for a domain
export const getRecentItemsForDomain = (domainId: string | null): RecentItem[] => {
  if (!domainId) return mockRecentItems.default;
  return mockRecentItems[domainId] || mockRecentItems.default;
};

// Mock API delay simulator
export const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 300));