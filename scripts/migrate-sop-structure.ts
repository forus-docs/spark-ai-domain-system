import { connectToDatabase } from '../app/lib/database';
import Process from '../app/models/Process';
import mongoose from 'mongoose';
import { IStandardOperatingProcedure } from '../app/models/Process';

// Example SOP structures for existing processes
const sopTemplates: Record<string, IStandardOperatingProcedure> = {
  'safety-compliance': {
    objective: 'Ensure all vehicles meet safety standards and regulatory compliance requirements through systematic verification and documentation.',
    scope: {
      included: ['All fleet vehicles', 'Driver safety equipment', 'Vehicle documentation'],
      excluded: ['Personal vehicles', 'Third-party contractors'],
      applicableTo: ['Fleet operators', 'Vehicle owners', 'Safety officers']
    },
    policies: {
      compliance: ['DOT regulations', 'OSHA safety standards', 'Local transport authority rules'],
      standards: ['ISO 39001 Road Traffic Safety', 'Fleet Safety Management Standards'],
      regulations: ['Vehicle roadworthiness certificates', 'Driver license verification', 'Insurance compliance']
    },
    rolesAndResponsibilities: [
      {
        role: 'Fleet Manager',
        responsibilities: ['Oversee compliance program', 'Review inspection reports', 'Approve corrective actions'],
        requiredSkills: ['Fleet management certification', 'Safety regulations knowledge']
      },
      {
        role: 'Safety Inspector',
        responsibilities: ['Conduct vehicle inspections', 'Document findings', 'Report non-compliance'],
        requiredSkills: ['Vehicle inspection certification', 'Safety audit training']
      },
      {
        role: 'Vehicle Operator',
        responsibilities: ['Pre-trip inspections', 'Report safety issues', 'Maintain vehicle cleanliness'],
        requiredSkills: ['Valid driver license', 'Basic vehicle maintenance knowledge']
      }
    ],
    procedures: [
      {
        stepNumber: 1,
        name: 'Pre-Inspection Preparation',
        description: 'Gather all required documentation and prepare vehicle for inspection',
        responsible: 'Vehicle Operator',
        inputs: ['Vehicle registration', 'Insurance documents', 'Previous inspection reports'],
        outputs: ['Inspection checklist', 'Document folder'],
        duration: '15 minutes'
      },
      {
        stepNumber: 2,
        name: 'Document Verification',
        description: 'Verify all vehicle documents are current and valid',
        responsible: 'Safety Inspector',
        inputs: ['Vehicle documents', 'Compliance database'],
        outputs: ['Document verification report'],
        tools: ['Document scanner', 'Compliance tracking system'],
        duration: '20 minutes',
        decisionPoints: [
          {
            condition: 'Documents expired',
            truePath: 'Flag for renewal and proceed with limited inspection',
            falsePath: 'Continue to full inspection'
          }
        ]
      },
      {
        stepNumber: 3,
        name: 'Physical Vehicle Inspection',
        description: 'Conduct comprehensive safety inspection of vehicle components',
        responsible: 'Safety Inspector',
        inputs: ['Inspection checklist', 'Vehicle'],
        outputs: ['Completed inspection form', 'Photo evidence'],
        tools: ['Inspection toolkit', 'Camera', 'Diagnostic scanner'],
        duration: '45 minutes'
      },
      {
        stepNumber: 4,
        name: 'Compliance Assessment',
        description: 'Evaluate inspection results against compliance standards',
        responsible: 'Safety Inspector',
        inputs: ['Inspection results', 'Compliance standards'],
        outputs: ['Compliance report', 'Action items list'],
        duration: '30 minutes',
        decisionPoints: [
          {
            condition: 'Critical safety issues found',
            truePath: 'Issue immediate grounding notice',
            falsePath: 'Proceed to certification'
          }
        ]
      },
      {
        stepNumber: 5,
        name: 'Report Generation',
        description: 'Create comprehensive compliance report with recommendations',
        responsible: 'Safety Inspector',
        inputs: ['All inspection data', 'Photos', 'Compliance assessment'],
        outputs: ['Final compliance report', 'Certificate of compliance (if passed)'],
        tools: ['Report generation system'],
        duration: '20 minutes'
      },
      {
        stepNumber: 6,
        name: 'Management Review',
        description: 'Review inspection findings and approve corrective actions',
        responsible: 'Fleet Manager',
        inputs: ['Compliance report', 'Action items'],
        outputs: ['Approved action plan', 'Timeline for corrections'],
        duration: '30 minutes'
      }
    ],
    metadata: {
      version: '2.0',
      effectiveDate: new Date('2024-01-01'),
      reviewDate: new Date('2025-01-01'),
      owner: 'Fleet Safety Department',
      approvedBy: 'Chief Safety Officer',
      changeHistory: [
        {
          version: '1.0',
          date: new Date('2023-01-01'),
          changes: 'Initial SOP creation',
          changedBy: 'Safety Team'
        },
        {
          version: '2.0',
          date: new Date('2024-01-01'),
          changes: 'Added AI-assisted inspection capabilities',
          changedBy: 'Digital Transformation Team'
        }
      ]
    }
  }
};

async function migrateSopStructure() {
  try {
    await connectToDatabase();
    
    console.log('🔄 Migrating SOP structure for existing processes...\n');

    // Find all SOP processes
    const sopProcesses = await Process.find({ executionModel: 'sop' });
    
    console.log(`Found ${sopProcesses.length} SOP processes to migrate\n`);

    for (const process of sopProcesses) {
      console.log(`Processing: ${process.name} (${process.processId})`);
      
      // Check if already has SOP structure
      if (process.standardOperatingProcedure) {
        console.log('  ✅ Already has SOP structure, skipping...\n');
        continue;
      }

      // Get template or create basic structure
      const sopTemplate = sopTemplates[process.processId];
      
      if (sopTemplate) {
        // Use template
        process.standardOperatingProcedure = sopTemplate;
        await process.save();
        console.log('  ✅ Applied SOP template\n');
      } else {
        // Create basic structure
        const basicSop: IStandardOperatingProcedure = {
          objective: process.description,
          scope: {
            included: ['All applicable entities'],
            excluded: [],
            applicableTo: ['Domain participants']
          },
          policies: {
            compliance: [],
            standards: [],
            regulations: []
          },
          rolesAndResponsibilities: [
            {
              role: 'Process Owner',
              responsibilities: ['Execute process', 'Ensure compliance']
            }
          ],
          procedures: [
            {
              stepNumber: 1,
              name: 'Process Initiation',
              description: 'Begin the standardized process',
              responsible: 'Process Owner',
              inputs: [],
              outputs: [],
              duration: 'Varies'
            }
          ],
          metadata: {
            version: '1.0',
            effectiveDate: new Date(),
            reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            owner: 'Process Management',
            approvedBy: 'System Administrator'
          }
        };
        
        process.standardOperatingProcedure = basicSop;
        await process.save();
        console.log('  ✅ Created basic SOP structure\n');
      }
    }

    // Summary
    console.log('📊 Migration Summary:');
    console.log(`Processed ${sopProcesses.length} SOP processes`);
    console.log(`Applied templates: ${Object.keys(sopTemplates).length}`);
    console.log(`Created basic structures: ${sopProcesses.length - Object.keys(sopTemplates).length}`);

  } catch (error) {
    console.error('❌ Error migrating SOP structure:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateSopStructure();