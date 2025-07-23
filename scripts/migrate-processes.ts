import { connectToDatabase } from '../app/lib/database';
import Process from '../app/models/Process';
import { 
  mavenProcesses, 
  wowProcesses, 
  bemnetProcesses, 
  pacciProcesses 
} from '../app/lib/sprint2-mock-data/process-mock-data';
import mongoose from 'mongoose';

// Map domain IDs to process arrays
const domainProcessMap = {
  'maven-hub': mavenProcesses,
  'wealth-on-wheels': wowProcesses,
  'bemnet': bemnetProcesses,
  'pacci': pacciProcesses
};

async function migrateProcesses() {
  try {
    await connectToDatabase();
    
    console.log('🚀 Starting process migration...');

    // Clear existing processes
    await Process.deleteMany({});
    console.log('✅ Cleared existing processes');
    
    let totalProcesses = 0;
    
    // Process each domain's processes
    for (const [domainId, processes] of Object.entries(domainProcessMap)) {
      
      console.log(`\n📦 Migrating processes for domain: ${domainId}`);
      
      for (const mockProcess of processes) {
        console.log(`  - Processing: ${mockProcess.name}`);
        
        // Convert mock data to Process model format
        const processData = {
          processId: mockProcess.id,
          domainId: domainId, // Use domainId string directly
          name: mockProcess.name,
          executionModel: mockProcess.executionModel,
          description: mockProcess.description,
          currentStage: mockProcess.currentStage,
          allowedRoles: mockProcess.allowedRoles,
          aiAgentAttached: mockProcess.aiAgentAttached || false,
          aiAgentRole: mockProcess.aiAgentRole,
          aiCurrentFocus: mockProcess.aiCurrentFocus,
          // Add specific fields based on execution model
          ...getExecutionModelSpecificFields(mockProcess),
          executionCount: Math.floor(Math.random() * 1000),
          averageCompletionTime: Math.floor(Math.random() * 3600),
          successRate: 0.85 + Math.random() * 0.15,
          active: true
        };
        
        const process = await Process.create(processData);
        console.log(`    ✅ Created: ${process.name} (${process.executionModel})`);
        totalProcesses++;
      }
    }
    
    // Display summary
    console.log(`\n✅ Migration complete!`);
    console.log(`📊 Total processes migrated: ${totalProcesses}`);
    
    // Show process breakdown by execution model
    const modelCounts = await Process.aggregate([
      { $group: { _id: '$executionModel', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📋 Processes by Execution Model:');
    modelCounts.forEach(({ _id, count }) => {
      console.log(`  - ${_id}: ${count} processes`);
    });
    
    // Show AI agent statistics
    const aiAgentCount = await Process.countDocuments({ 'aiAgentAttached': true });
    const promotedCount = await Process.countDocuments({ currentStage: 'ai_promoted' });
    
    console.log('\n🤖 AI Agent Statistics:');
    console.log(`  - Processes with AI agents: ${aiAgentCount}`);
    console.log(`  - AI-promoted processes: ${promotedCount}`);

  } catch (error) {
    console.error('❌ Error migrating processes:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get AI capabilities based on execution model
function getAICapabilities(executionModel: string): string[] {
  const capabilities: Record<string, string[]> = {
    form: [
      'Field validation and auto-completion',
      'Data extraction from documents',
      'Smart defaults based on context',
      'Error prediction and prevention'
    ],
    sop: [
      'Step-by-step guidance',
      'Compliance checking',
      'Anomaly detection',
      'Process optimization suggestions'
    ],
    knowledge: [
      'Information retrieval',
      'Pattern recognition',
      'Insight generation',
      'Predictive analytics'
    ],
    bpmn: [
      'Workflow orchestration',
      'Decision automation',
      'Resource optimization',
      'Process mining'
    ],
    training: [
      'Personalized curriculum',
      'Progress tracking',
      'Adaptive learning paths',
      'Performance assessment'
    ]
  };
  
  return capabilities[executionModel] || [];
}

// Get execution model specific fields
function getExecutionModelSpecificFields(mockProcess: any): any {
  const fields: any = {};
  
  if (mockProcess.executionModel === 'sop' && mockProcess.standardizationGoals) {
    fields.sopDetails = {
      standardizationGoals: mockProcess.standardizationGoals,
      complianceChecks: [
        'Initial validation',
        'Process adherence',
        'Quality assurance',
        'Final approval'
      ],
      deviationHandling: 'Alert supervisor and log for review'
    };
  }
  
  if (mockProcess.executionModel === 'bpmn') {
    fields.bpmnDetails = {
      decisionPoints: [
        'Resource allocation',
        'Priority routing',
        'Exception handling'
      ],
      integrations: ['ERP system', 'Payment gateway', 'Notification service'],
      parallelPaths: 2
    };
  }
  
  if (mockProcess.executionModel === 'knowledge') {
    fields.knowledgeDetails = {
      dataSources: ['Internal database', 'External APIs', 'Historical records'],
      analysisTypes: ['Trend analysis', 'Comparative analysis', 'Predictive modeling'],
      outputFormats: ['Report', 'Dashboard', 'API response']
    };
  }
  
  if (mockProcess.executionModel === 'form') {
    fields.formDetails = {
      fields: generateFormFields(mockProcess.name),
      validationRules: ['Required fields', 'Format validation', 'Business rules'],
      conditionalLogic: true
    };
  }
  
  if (mockProcess.executionModel === 'training') {
    fields.trainingDetails = {
      curriculum: generateTrainingModules(mockProcess.name)
    };
  }
  
  // Add promotion details if applicable
  if (mockProcess.currentStage === 'ai_promoted') {
    fields.promotionDetails = {
      promotionDate: mockProcess.promotionDate || new Date('2024-12-15'),
      promotedArtifact: mockProcess.promotionArtifact,
      originalRole: mockProcess.aiAgentRole,
      newFocus: mockProcess.aiCurrentFocus
    };
  }
  
  // Add improvement tracking
  if (mockProcess.aiImprovements) {
    fields.improvements = {
      identified: mockProcess.aiImprovements,
      implemented: mockProcess.aiImprovements.length,
      impact: 'Significant process optimization'
    };
  }
  
  return fields;
}

// Generate form fields based on process name
function generateFormFields(processName: string): any[] {
  const fieldSets: Record<string, any[]> = {
    'Investor Profile Creation': [
      { name: 'fullName', type: 'text', required: true },
      { name: 'investmentExperience', type: 'select', required: true },
      { name: 'investmentRange', type: 'range', required: true },
      { name: 'sectors', type: 'multiselect', required: true },
      { name: 'linkedinProfile', type: 'url', required: false }
    ],
    'Savings Goal Planning': [
      { name: 'goalAmount', type: 'currency', required: true },
      { name: 'targetDate', type: 'date', required: true },
      { name: 'monthlyIncome', type: 'currency', required: true },
      { name: 'savingsStrategy', type: 'select', required: true }
    ]
  };
  
  return fieldSets[processName] || [
    { name: 'field1', type: 'text', required: true },
    { name: 'field2', type: 'number', required: false }
  ];
}

// Generate training modules based on process name
function generateTrainingModules(processName: string): any[] {
  const moduleSets: Record<string, any[]> = {
    'Driver Safety Training': [
      { moduleId: 'safety-basics', name: 'Road Safety Basics', duration: 30, required: true },
      { moduleId: 'defensive-driving', name: 'Defensive Driving', duration: 45, required: true },
      { moduleId: 'vehicle-maintenance', name: 'Vehicle Maintenance', duration: 20, required: false },
      { moduleId: 'emergency-procedures', name: 'Emergency Procedures', duration: 25, required: true }
    ]
  };
  
  return moduleSets[processName] || [
    { moduleId: 'intro', name: 'Introduction', duration: 15, required: true },
    { moduleId: 'core', name: 'Core Concepts', duration: 30, required: true },
    { moduleId: 'assessment', name: 'Assessment', duration: 20, required: true }
  ];
}

// Run the migration
migrateProcesses();