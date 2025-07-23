import React, { useState } from 'react';

// UNIFIED DOMAIN DATA STRUCTURE
// All domains now support multiple roles with consistent schema
const domains = [
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

export default function UnifiedDomainSystem() {
  // CORE DOMAIN STATE MANAGEMENT
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [userMemberships, setUserMemberships] = useState([]);  // Array of UserDomainMembership
  const [currentDomain, setCurrentDomain] = useState(null);
  
  // UI STATE MANAGEMENT  
  const [activeSection, setActiveSection] = useState('domains');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  
  // ROLE & MEMBERSHIP STATE
  const [selectedRole, setSelectedRole] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('new');
  const [identityVerified, setIdentityVerified] = useState(false);

  // UNIFIED HELPER FUNCTIONS
  
  // Check if user has joined a specific domain
  const isJoined = (domainId) => userMemberships.some(m => m.domainId === domainId);
  
  // Get the role user selected when joining a domain
  const getJoinedRole = (domainId) => {
    const membership = userMemberships.find(m => m.domainId === domainId);
    return membership?.roleId;
  };

  // Get role information for any domain
  const getRoleInfo = (domainId, roleId) => {
    const domain = domains.find(d => d.id === domainId);
    return domain?.roles?.find(r => r.id === roleId);
  };

  // Get display name for a role
  const getRoleDisplayName = (domainId, roleId) => {
    const role = getRoleInfo(domainId, roleId);
    return role?.name || 'Member';
  };

  // Get current domain info
  const getCurrentDomainInfo = () => {
    if (!currentDomain) return null;
    return domains.find(d => d.id === currentDomain);
  };

  // Get joined domains with their associated roles
  const getJoinedDomainsInfo = () => {
    return userMemberships.map(membership => {
      const domain = domains.find(d => d.id === membership.domainId);
      return { ...domain, joinedRole: membership.roleId };
    });
  };

  // Get default role for a domain
  const getDefaultRole = (domain) => {
    return domain.roles?.find(r => r.isDefault) || domain.roles?.[0];
  };

  // Check if domain has multiple roles
  const hasMultipleRoles = (domain) => {
    return domain.roles && domain.roles.length > 1;
  };

  // Initialize selected role when selecting a domain
  const initializeSelectedRole = (domain) => {
    if (isJoined(domain.id)) {
      setSelectedRole(getJoinedRole(domain.id));
    } else {
      const defaultRole = getDefaultRole(domain);
      setSelectedRole(defaultRole?.id || null);
    }
  };

  // Sidebar items configuration
  const sidebarItems = [
    { id: 'newworkstream', label: 'New workstream', icon: '➕' },
    { id: 'organogram', label: 'Organogram', icon: '🏢', domainSpecific: true },
    { id: 'workstreams', label: 'Workstreams', icon: '🔄', domainSpecific: true },
    { id: 'procedures', label: 'Procedures', icon: '📋', domainSpecific: true },
    { id: 'tasks', label: 'Tasks', icon: '✅', domainSpecific: true },
    { id: 'dashboards', label: 'Dashboards', icon: '📊', domainSpecific: true },
  ];

  // UNIFIED DOMAIN JOIN HANDLER
  const handleJoin = (domainId) => {
    const domain = domains.find(d => d.id === domainId);
    const roleToJoin = selectedRole || getDefaultRole(domain)?.id;
    
    setUserMemberships([
      ...userMemberships.filter(m => m.domainId !== domainId), 
      { domainId: domainId, roleId: roleToJoin }
    ]);
    
    setSelectedDomain(null);
    setSelectedRole(null);
    setIdentityVerified(false);
  };

  // Get domain-specific recent items
  const getDomainRecentItems = (domainId) => {
    const recentItemsMap = {
      maven: [
        { icon: '📊', title: 'Investment Analytics', desc: 'Q1 portfolio performance review...', time: '2 hours ago', section: 'dashboards' },
        { icon: '✅', title: 'Due Diligence Review', desc: 'Tech startup evaluation pending...', time: '3 hours ago', section: 'tasks' }
      ],
      wow: [
        { icon: '📊', title: 'Fleet Performance', desc: 'Weekly route optimization results...', time: '1 hour ago', section: 'dashboards' },
        { icon: '✅', title: 'Driver Onboarding', desc: '15 new drivers pending verification...', time: '4 hours ago', section: 'tasks' }
      ],
      bemnet: [
        { icon: '💰', title: 'Savings Dashboard', desc: 'Monthly savings goal progress...', time: '2 hours ago', section: 'dashboards' },
        { icon: '📋', title: 'Credit Application', desc: 'New loan request for review...', time: '5 hours ago', section: 'procedures' }
      ],
      pacci: [
        { icon: '🤝', title: 'Trade Opportunities', desc: 'New B2B connections available...', time: '1 hour ago', section: 'workstreams' },
        { icon: '📊', title: 'Export Analytics', desc: 'Cross-border trade metrics...', time: '3 hours ago', section: 'dashboards' }
      ]
    };
    
    return recentItemsMap[domainId] || [
      { icon: '📊', title: 'Activity Dashboard', desc: 'Latest metrics and insights...', time: '2 hours ago', section: 'dashboards' },
      { icon: '🔄', title: 'Project Update', desc: 'Weekly progress review...', time: '3 hours ago', section: 'workstreams' }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex" onClick={() => setDomainDropdownOpen(false)}>
      
      {/* LEFT SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}>
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="flex-1 overflow-y-auto p-4">
            {/* DOMAIN SELECTOR DROPDOWN */}
            <div className="mb-6 relative">
              <button
                onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg opacity-80">🌐</span>
                <div className="flex-1 text-left">
                  {currentDomain ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {getCurrentDomainInfo()?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName(currentDomain, getJoinedRole(currentDomain))} • {getCurrentDomainInfo()?.region}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">Join a Domain</span>
                  )}
                </div>
                <span className={`text-gray-400 transition-transform ${domainDropdownOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {/* DROPDOWN CONTENT */}
              {domainDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setActiveSection('domains');
                      setCurrentDomain(null);
                      setDomainDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <span className="text-lg opacity-80">🌐</span>
                    <span className="text-sm">Browse all domains</span>
                  </button>
                  
                  {getJoinedDomainsInfo().length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                        Your Domains
                      </div>
                      {getJoinedDomainsInfo().map(domain => (
                        <button
                          key={domain.id}
                          onClick={() => {
                            setCurrentDomain(domain.id);
                            setActiveSection('workstreams');
                            setDomainDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                            currentDomain === domain.id ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <span className="text-lg">{domain.icon}</span>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{domain.name}</p>
                            <p className="text-xs text-gray-500">
                              {getRoleDisplayName(domain.id, domain.joinedRole)} • {domain.region}
                            </p>
                          </div>
                          {currentDomain === domain.id && (
                            <span className="text-blue-500">✓</span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                  
                  {getJoinedDomainsInfo().length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Join domains to access their features
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* NAVIGATION ITEMS */}
            <nav className="space-y-1">
              {sidebarItems.slice(1).map(item => {
                if (item.domainSpecific && !currentDomain) {
                  return null;
                }
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      activeSection === item.id 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {currentDomain && item.domainSpecific && (
                      <span className="text-xs text-gray-400">
                        {getCurrentDomainInfo()?.icon}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            
            {/* RECENT ITEMS */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Recent {currentDomain && getCurrentDomainInfo() ? `• ${getCurrentDomainInfo().name}` : ''}
              </h3>
              <div className="space-y-3">
                {currentDomain ? (
                  getDomainRecentItems(currentDomain).map((item, index) => (
                    <div 
                      key={index}
                      onClick={() => setActiveSection(item.section)}
                      className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                          <p className="text-xs text-gray-600 truncate">{item.desc}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div 
                      onClick={() => setActiveSection('domains')}
                      className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">🌐</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">Maven Hub Discussion</p>
                          <p className="text-xs text-gray-600 truncate">Looking at investment opportunities in...</p>
                          <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setActiveSection('domains')}
                      className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">🚖</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">WoW Commuter Onboarding</p>
                          <p className="text-xs text-gray-600 truncate">New cashless payment features rolling out...</p>
                          <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* User section at bottom */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-semibold text-white">
                J
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Jacques</p>
                <p className="text-xs text-gray-500">Max plan</p>
              </div>
              <span className="text-gray-400">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {/* Top bar with sidebar toggle */}
        <div className="mb-4 flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
          >
            {sidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          {!sidebarOpen && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">{sidebarItems.find(item => item.id === activeSection)?.icon}</span>
              <span className="font-medium">{sidebarItems.find(item => item.id === activeSection)?.label}</span>
            </div>
          )}
        </div>
        
        {activeSection === 'domains' && (
          <>
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
              <h1 className="text-2xl font-bold mb-4">Domains</h1>
              <div className="flex gap-4 items-center">
                <input 
                  type="text" 
                  placeholder="Search domains..."
                  className="flex-1 p-2 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <button className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors">
                  <span className="text-xl">+</span>
                </button>
              </div>
            </div>

            {/* Domain Grid */}
            {!selectedDomain && (
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {domains.map(domain => (
                  <div 
                    key={domain.id}
                    onClick={() => {
                      setSelectedDomain(domain);
                      setMembershipStatus('new');
                      setIdentityVerified(false);
                      initializeSelectedRole(domain);
                    }}
                    className="relative bg-white p-6 rounded-lg cursor-pointer hover:shadow-lg transition-all border border-gray-200 overflow-hidden group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{domain.icon}</span>
                          <h3 className="text-lg font-bold">{domain.name}</h3>
                        </div>
                        {isJoined(domain.id) && (
                          <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">
                            {getRoleDisplayName(domain.id, getJoinedRole(domain.id))}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{domain.tagline}</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-800">{domain.cta}</p>
                        <p className="text-xs text-gray-500">Region: {domain.region}</p>
                        {hasMultipleRoles(domain) && (
                          <p className="text-xs text-gray-500">
                            {domain.roles.length} roles available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Join Screen */}
            {selectedDomain && (
              <div className="max-w-4xl mx-auto">
                <button 
                  onClick={() => {
                    setSelectedDomain(null);
                    setSelectedRole(null);
                    setMembershipStatus('new');
                    setIdentityVerified(false);
                    setSidebarOpen(true);
                  }}
                  className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Domains</span>
                </button>
                
                <div className="relative bg-white rounded-lg p-8 overflow-hidden shadow-lg border border-gray-200">
                  <div className={`absolute inset-0 bg-gradient-to-br ${selectedDomain.gradient} opacity-5`} />
                  <div className="absolute inset-1 bg-white rounded-lg" />
                  
                  <div className="relative">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <span className="text-3xl">{selectedDomain.icon}</span>
                      Join {selectedDomain.name}
                    </h2>
                    
                    {/* IDENTITY VERIFICATION SECTION */}
                    <div className={`grid gap-6 mb-8 ${selectedDomain.id === 'maven' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                      <div className="relative">
                        <p className="text-gray-600 mb-2">Identity Verification</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-semibold">{selectedDomain.joinDetails.minInvestment}</p>
                          {identityVerified && (
                            <span className="text-green-500 text-sm">✓ Verified</span>
                          )}
                        </div>
                      </div>
                      {selectedDomain.id === 'maven' && (
                        <div>
                          <p className="text-gray-600 mb-2">Minimum Investment</p>
                          <p className="text-xl font-semibold">{selectedDomain.joinDetails.minimumInvestment}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600 mb-2">Key Benefit</p>
                        <p className="text-xl font-semibold">{selectedDomain.joinDetails.benefit}</p>
                      </div>
                    </div>

                    {selectedDomain.hasExistingMembers && !isJoined(selectedDomain.id) && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Membership Status</h3>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="membershipStatus"
                              value="new"
                              checked={membershipStatus === 'new'}
                              onChange={(e) => setMembershipStatus(e.target.value)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span>I am a new member</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="membershipStatus"
                              value="existing"
                              checked={membershipStatus === 'existing'}
                              onChange={(e) => setMembershipStatus(e.target.value)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span>I am already a member</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* UNIFIED ROLE SELECTION */}
                    {hasMultipleRoles(selectedDomain) && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">
                          {isJoined(selectedDomain.id) ? 'Your role:' : 'Select your role:'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {selectedDomain.roles.map((role) => (
                            <label 
                              key={role.id}
                              className={`relative block p-4 rounded-lg border-2 transition-all ${
                                selectedRole === role.id 
                                  ? `border-${selectedDomain.color} bg-opacity-10` 
                                  : isJoined(selectedDomain.id) 
                                    ? 'border-gray-300 bg-gray-50'
                                    : 'border-gray-300 hover:border-gray-400 bg-white'
                              } ${isJoined(selectedDomain.id) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                              style={{
                                borderColor: selectedRole === role.id ? selectedDomain.color : undefined,
                                backgroundColor: selectedRole === role.id ? `${selectedDomain.color}10` : undefined
                              }}
                            >
                              <input
                                type="radio"
                                name="role"
                                value={role.id}
                                checked={selectedRole === role.id}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                disabled={isJoined(selectedDomain.id)}
                                className="sr-only"
                              />
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{role.name}</span>
                                <span className="text-sm font-bold" style={{color: selectedDomain.color}}>
                                  {role.price}
                                </span>
                              </div>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {role.benefits.slice(0, 2).map((benefit, i) => (
                                  <li key={i}>• {benefit}</li>
                                ))}
                              </ul>
                            </label>
                          ))}
                        </div>
                        
                        {/* DETAILED BENEFITS for selected role */}
                        {selectedRole && (
                          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold mb-2">
                              {getRoleDisplayName(selectedDomain.id, selectedRole)} Benefits:
                            </h4>
                            <ul className="text-sm space-y-1">
                              {getRoleInfo(selectedDomain.id, selectedRole)?.benefits.map((benefit, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="text-green-500">✓</span>
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SINGLE ROLE BENEFITS */}
                    {!hasMultipleRoles(selectedDomain) && selectedDomain.roles?.[0] && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">What you get:</h3>
                        <ul className="space-y-2">
                          {selectedDomain.roles[0].benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* JOIN BUTTON */}
                    {!isJoined(selectedDomain.id) ? (
                      <button 
                        onClick={() => {
                          if (!identityVerified) {
                            setIdentityVerified(true);
                          } else {
                            handleJoin(selectedDomain.id);
                          }
                        }}
                        className="w-full py-4 rounded-lg font-medium text-base transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800"
                      >
                        {!identityVerified 
                          ? 'Verify Identity'
                          : selectedDomain.hasExistingMembers && membershipStatus === 'existing'
                            ? 'Verify Membership'
                            : hasMultipleRoles(selectedDomain) 
                              ? `Join as ${getRoleDisplayName(selectedDomain.id, selectedRole)}`
                              : 'Join Now'
                        }
                      </button>
                    ) : (
                      <div className="text-center">
                        <div className="text-green-500 font-semibold mb-2">
                          ✓ You've joined this domain
                          {hasMultipleRoles(selectedDomain) && 
                            ` as ${getRoleDisplayName(selectedDomain.id, getJoinedRole(selectedDomain.id))}`
                          }
                        </div>
                        {hasMultipleRoles(selectedDomain) && (
                          <p className="text-sm text-gray-600">
                            To change roles, please contact support
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Other sections remain the same but now show domain context consistently */}
        {['workstreams', 'tasks', 'teams', 'procedures', 'dashboards'].includes(activeSection) && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">
              {sidebarItems.find(item => item.id === activeSection)?.label}
              {currentDomain && getCurrentDomainInfo() && (
                <span className="text-lg text-gray-600 ml-2">
                  • {getCurrentDomainInfo().icon} {getCurrentDomainInfo().name}
                  {getJoinedRole(currentDomain) && (
                    <span className="text-sm"> ({getRoleDisplayName(currentDomain, getJoinedRole(currentDomain))})</span>
                  )}
                </span>
              )}
            </h1>
            {currentDomain ? (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-3xl opacity-20 mb-6">{getCurrentDomainInfo()?.icon}</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {getCurrentDomainInfo()?.name} {activeSection} coming soon
                </h3>
                <p className="text-sm text-gray-500">
                  You're logged in as {getRoleDisplayName(currentDomain, getJoinedRole(currentDomain))}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-3xl opacity-20 mb-6">🌐</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a domain to view {activeSection}
                </h3>
                <p className="text-sm text-gray-500">
                  Browse domains to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}