// Mock data for Sprint 2 - Processes with Execution Models
// Based on the domains-paradigm-report.md

// Note: This shows PROCESSES, not AI agents. 
// AI agents are optional tools that can be attached to processes.

// Maven Hub Processes
export const mavenProcesses = [
  {
    id: 'maven-investor-onboarding',
    name: 'Investor Profile Creation',
    executionModel: 'form',
    description: 'Collect and verify investor information for KYC compliance',
    currentStage: 'assisted', // AI helps fill forms
    aiAgentAttached: true,
    aiAgentRole: 'Pre-fills fields based on LinkedIn profile, validates accreditation status',
    allowedRoles: ['investor', 'project_owner', 'advisor']
  },
  {
    id: 'maven-deal-analysis',
    name: 'Investment Opportunity Analysis',
    executionModel: 'knowledge',
    description: 'Research and analyze potential investment opportunities',
    currentStage: 'manual', // Human still does most analysis
    aiAgentAttached: true,
    aiAgentRole: 'Learning patterns from analyst decisions, starting to suggest comparables',
    allowedRoles: ['investor', 'advisor']
  },
  {
    id: 'maven-project-listing',
    name: 'Project Registration Process',
    executionModel: 'sop',
    description: 'Standardized process for consistent, high-quality project listings',
    currentStage: 'supervised', // AI handles most steps, human approves
    aiAgentAttached: true,
    aiAgentRole: 'Ensures all projects follow the same quality standards, suggests improvements based on successful listings',
    allowedRoles: ['project_owner'],
    // Standardization Benefits
    standardizationGoals: [
      'Consistent project information quality',
      'Predictable review timelines',
      'Improved investor experience',
      'Data-driven process improvements'
    ],
    aiImprovements: [
      'Identified that projects with video intros get 3x more views',
      'Suggested adding financial projections template',
      'Automated quality score calculation'
    ]
  }
];

// Wealth on Wheels Processes
export const wowProcesses = [
  {
    id: 'wow-route-optimization',
    name: 'Daily Fleet Route Planning',
    executionModel: 'bpmn',
    description: 'Optimize vehicle routes based on demand and traffic',
    currentStage: 'ai_promoted', // AI promoted to higher-value work
    aiAgentAttached: false, // AI promoted from this mundane task
    promotionArtifact: 'Python optimization algorithm deployed to Lambda',
    promotionDate: '2024-12-15',
    aiCurrentFocus: 'Now working on predictive maintenance and demand forecasting',
    allowedRoles: ['cooperative', 'operator']
  },
  {
    id: 'wow-driver-certification',
    name: 'Driver Safety Training',
    executionModel: 'training',
    description: 'Safety and efficiency training program for drivers',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Personalizes curriculum based on driver performance data',
    allowedRoles: ['driver']
  },
  {
    id: 'wow-vehicle-inspection',
    name: 'Daily Vehicle Inspection Procedure',
    executionModel: 'sop',
    description: 'Standardized inspection ensuring consistent vehicle safety and reliability',
    currentStage: 'manual',
    aiAgentAttached: false, // Ready for AI to learn the standard
    allowedRoles: ['cooperative', 'operator', 'driver'],
    // Standardization Benefits
    standardizationGoals: [
      'Consistent safety checks across all vehicles',
      'Predictable maintenance needs',
      'Reduced breakdowns through early detection',
      'Better fleet reliability metrics'
    ],
    potentialAIValue: [
      'Learn common failure patterns',
      'Predict maintenance needs',
      'Optimize inspection sequence',
      'Generate automated reports'
    ]
  }
];

// Bemnet Processes
export const bemnetProcesses = [
  {
    id: 'bemnet-credit-assessment',
    name: 'Credit Score Calculation',
    executionModel: 'knowledge',
    description: 'Analyze transaction history to determine creditworthiness',
    currentStage: 'supervised',
    aiAgentAttached: true,
    aiAgentRole: 'Analyzes blockchain transactions, generates credit insights',
    allowedRoles: ['member']
  },
  {
    id: 'bemnet-savings-plan',
    name: 'Savings Goal Planning',
    executionModel: 'form',
    description: 'Create personalized savings plans based on income and goals',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Suggests savings targets, recommends allocation strategies',
    allowedRoles: ['member', 'merchant']
  }
];

// PACCI Processes
export const pacciProcesses = [
  {
    id: 'pacci-trade-finance',
    name: 'Trade Finance Application',
    executionModel: 'bpmn',
    description: 'End-to-end trade finance processing with smart contracts',
    currentStage: 'supervised',
    aiAgentAttached: true,
    aiAgentRole: 'Validates documents, assesses risk, drafts smart contracts',
    allowedRoles: ['member']
  },
  {
    id: 'pacci-market-research',
    name: 'Market Intelligence Gathering',
    executionModel: 'knowledge',
    description: 'Collect and analyze market data across African markets',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Aggregates data sources, identifies trends, generates reports',
    allowedRoles: ['member']
  }
];

// Aggregate all processes by domain
export const processesByDomain: Record<string, any[]> = {
  maven: mavenProcesses,
  wow: wowProcesses,
  bemnet: bemnetProcesses,
  pacci: pacciProcesses
};

// Helper to get processes for a domain
export function getProcessesForDomain(domainId: string) {
  return processesByDomain[domainId] || [];
}

// Helper to show process maturity
export function getProcessMaturity(process: any) {
  const stages: Record<string, string> = {
    manual: 'Manual Process',
    assisted: 'AI-Assisted',
    supervised: 'AI-Supervised',
    automated: 'Fully Automated',
    ai_promoted: 'AI Promoted ✓'
  };
  return stages[process.currentStage] || 'Unknown';
}

// Helper to check if process achieved AI promotion
export function hasAchievedAIPromotion(process: any) {
  return process.currentStage === 'ai_promoted';
}