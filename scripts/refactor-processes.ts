import mongoose from 'mongoose';
import Process from '../app/models/Process';
import { connectToDatabase } from '../app/lib/database';

interface OldProcess {
  processId: string;
  domainId: string;
  name: string;
  description: string;
  executionModel: string;
  currentStage: string;
  aiAgentAttached: boolean;
  aiAgentRole?: string;
  allowedRoles: string[];
  executionCount?: number;
  averageCompletionTime?: number;
  successRate?: number;
}

// Map domain-specific processes to generic categories
const processCategories: Record<string, string> = {
  'investor-onboarding': 'onboarding',
  'deal-analysis': 'operational',
  'project-listing': 'operational',
  'route-optimization': 'operational',
  'driver-certification': 'training',
  'vehicle-inspection': 'compliance',
  'credit-assessment': 'financial',
  'savings-plan': 'financial',
  'trade-finance': 'financial',
  'market-research': 'operational',
};

// Generic process definitions
const genericProcesses = [
  {
    processId: 'identity-verification',
    name: 'Identity Verification',
    description: 'Verify user identity for platform access and compliance',
    category: 'identity',
    executionModel: 'form',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Document verification, biometric matching, risk assessment',
  },
  {
    processId: 'profile-creation',
    name: 'Profile Creation',
    description: 'Create and complete user profile with role-specific information',
    category: 'onboarding',
    executionModel: 'form',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Pre-fills fields based on social profiles, validates information',
  },
  {
    processId: 'investment-analysis',
    name: 'Investment Analysis',
    description: 'Research and analyze investment or business opportunities',
    category: 'operational',
    executionModel: 'knowledge',
    currentStage: 'manual',
    aiAgentAttached: true,
    aiAgentRole: 'Pattern recognition, comparables analysis, risk assessment',
  },
  {
    processId: 'compliance-verification',
    name: 'Compliance Verification',
    description: 'Verify compliance with regulatory and safety requirements',
    category: 'compliance',
    executionModel: 'sop',
    currentStage: 'manual',
    aiAgentAttached: false,
  },
  {
    processId: 'route-planning',
    name: 'Route Planning and Optimization',
    description: 'Optimize routes based on demand, traffic, and resources',
    category: 'operational',
    executionModel: 'bpmn',
    currentStage: 'automated',
    aiAgentAttached: false,
  },
  {
    processId: 'safety-training',
    name: 'Safety and Compliance Training',
    description: 'Complete safety and compliance training modules',
    category: 'training',
    executionModel: 'training',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Personalizes curriculum based on performance data',
  },
  {
    processId: 'credit-scoring',
    name: 'Credit Score Analysis',
    description: 'Analyze financial history to determine creditworthiness',
    category: 'financial',
    executionModel: 'knowledge',
    currentStage: 'supervised',
    aiAgentAttached: true,
    aiAgentRole: 'Analyzes transaction patterns, generates credit insights',
  },
  {
    processId: 'financial-planning',
    name: 'Financial Goal Planning',
    description: 'Create personalized financial plans based on income and goals',
    category: 'financial',
    executionModel: 'form',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Suggests targets, recommends allocation strategies',
  },
  {
    processId: 'registration-process',
    name: 'Registration and Onboarding',
    description: 'Complete registration process with required documentation',
    category: 'onboarding',
    executionModel: 'sop',
    currentStage: 'supervised',
    aiAgentAttached: true,
    aiAgentRole: 'Ensures quality standards, suggests improvements',
  },
  {
    processId: 'market-analysis',
    name: 'Market Intelligence Analysis',
    description: 'Collect and analyze market data and trends',
    category: 'operational',
    executionModel: 'knowledge',
    currentStage: 'assisted',
    aiAgentAttached: true,
    aiAgentRole: 'Aggregates data sources, identifies trends, generates reports',
  },
];

async function refactorProcesses() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // First, fetch all existing processes
    const existingProcesses = await Process.find({}).lean() as unknown as OldProcess[];
    console.log(`Found ${existingProcesses.length} existing processes to refactor`);

    // Map existing processes to their domain adoptions
    const domainAdoptions = new Map<string, any[]>();

    for (const oldProcess of existingProcesses) {
      const category = processCategories[oldProcess.processId.split('-')[1]] || 'operational';
      
      // Find matching generic process
      let genericProcess = genericProcesses.find(gp => 
        gp.executionModel === oldProcess.executionModel && 
        gp.category === category
      );

      if (!genericProcess) {
        // Create a generic version if no match found
        genericProcess = {
          processId: oldProcess.processId.replace(/^[^-]+-/, ''),
          name: oldProcess.name.replace(/^[^:]+:\s*/, ''), // Remove domain prefix
          description: oldProcess.description,
          category: category as any,
          executionModel: oldProcess.executionModel as any,
          currentStage: oldProcess.currentStage as any,
          aiAgentAttached: oldProcess.aiAgentAttached,
          aiAgentRole: oldProcess.aiAgentRole,
        };
      }

      // Create domain adoption record
      const adoption = {
        domainId: oldProcess.domainId,
        adoptedAt: new Date(),
        allowedRoles: oldProcess.allowedRoles,
        customName: oldProcess.name,
        customDescription: oldProcess.description,
        isActive: true,
        metrics: {
          executionCount: oldProcess.executionCount || 0,
          averageCompletionTime: oldProcess.averageCompletionTime || 0,
          successRate: oldProcess.successRate || 0,
        },
      };

      // Group adoptions by generic process ID
      const adoptions = domainAdoptions.get(genericProcess.processId) || [];
      adoptions.push(adoption);
      domainAdoptions.set(genericProcess.processId, adoptions);
    }

    // Delete all existing processes
    await Process.deleteMany({});
    console.log('Cleared existing processes');

    // Create new generic processes
    for (const genericProcess of genericProcesses) {
      const adoptions = domainAdoptions.get(genericProcess.processId) || [];
      
      // Calculate global metrics from adoptions
      const globalMetrics = {
        totalExecutions: adoptions.reduce((sum, a) => sum + (a.metrics?.executionCount || 0), 0),
        averageCompletionTime: adoptions.length > 0 
          ? adoptions.reduce((sum, a) => sum + (a.metrics?.averageCompletionTime || 0), 0) / adoptions.length
          : 0,
        averageSuccessRate: adoptions.length > 0
          ? adoptions.reduce((sum, a) => sum + (a.metrics?.successRate || 0), 0) / adoptions.length
          : 0,
      };

      const newProcess = new Process({
        ...genericProcess,
        adoptedByDomains: adoptions,
        globalMetrics,
        active: true,
      });

      await newProcess.save();
      console.log(`Created generic process: ${genericProcess.processId} with ${adoptions.length} domain adoptions`);
    }

    // Add some additional generic processes that weren't in the original data
    const additionalProcesses = [
      {
        processId: 'document-upload',
        name: 'Document Upload and Verification',
        description: 'Upload and verify required documents',
        category: 'compliance',
        executionModel: 'form',
        currentStage: 'assisted',
        aiAgentAttached: true,
        aiAgentRole: 'Document classification, OCR, validation',
        adoptedByDomains: [],
        active: true,
      },
      {
        processId: 'payment-processing',
        name: 'Payment Processing',
        description: 'Process payments and financial transactions',
        category: 'financial',
        executionModel: 'bpmn',
        currentStage: 'automated',
        aiAgentAttached: false,
        adoptedByDomains: [],
        active: true,
      },
      {
        processId: 'customer-support',
        name: 'Customer Support Request',
        description: 'Handle customer support inquiries and issues',
        category: 'operational',
        executionModel: 'knowledge',
        currentStage: 'assisted',
        aiAgentAttached: true,
        aiAgentRole: 'Intent classification, solution recommendation, escalation',
        adoptedByDomains: [],
        active: true,
      },
    ];

    for (const process of additionalProcesses) {
      const newProcess = new Process(process);
      await newProcess.save();
      console.log(`Created additional generic process: ${process.processId}`);
    }

    console.log('Process refactoring complete!');
    
    // Display summary
    const allProcesses = await Process.find({});
    console.log(`\nTotal generic processes: ${allProcesses.length}`);
    
    const adoptionStats = allProcesses.reduce((acc, p) => {
      acc.total += p.adoptedByDomains.length;
      if (p.adoptedByDomains.length > 0) acc.adopted++;
      return acc;
    }, { total: 0, adopted: 0 });
    
    console.log(`Processes with adoptions: ${adoptionStats.adopted}`);
    console.log(`Total domain adoptions: ${adoptionStats.total}`);

  } catch (error) {
    console.error('Error refactoring processes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
refactorProcesses().catch(console.error);