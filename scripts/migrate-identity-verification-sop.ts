import { connectToDatabase } from '../app/lib/database';
import Process from '../app/models/Process';
import mongoose from 'mongoose';
import { IStandardOperatingProcedure } from '../app/models/Process';

async function migrateIdentityVerificationSOP() {
  try {
    await connectToDatabase();
    
    console.log('🔄 Migrating Identity Verification Process to SOP structure...\n');

    // Find the identity verification process
    const process = await Process.findById('687757428592055a37b33580');
    
    if (!process) {
      console.log('❌ Process not found');
      return;
    }

    console.log(`Found process: ${process.name} (${process.processId})`);
    
    // Check if already has SOP structure
    if (process.standardOperatingProcedure) {
      console.log('✅ Already has SOP structure, skipping...\n');
      return;
    }

    // Create the SOP structure based on existing data
    const sop: IStandardOperatingProcedure = {
      objective: 'Capture and verify government-issued ID documents to establish user identity while ensuring compliance with KYC, AML, and data protection regulations.',
      
      scope: {
        included: [
          'Government-issued ID documents (passports, national IDs, driver\'s licenses)',
          'Identity data extraction and validation',
          'Document authenticity verification',
          'Secure data storage'
        ],
        excluded: [
          'Non-government issued documents',
          'Expired documents older than 6 months',
          'Documents in non-supported languages',
          'Physical document handling'
        ],
        applicableTo: [
          'All new users requiring identity verification',
          'Existing users updating identity information',
          'Compliance officers reviewing verifications',
          'System administrators managing the process'
        ]
      },
      
      policies: {
        compliance: process.sopMetadata?.complianceStandards || ['KYC', 'AML', 'FICA', 'POPIA'],
        standards: [
          'ISO/IEC 27001 Information Security',
          'ISO/IEC 29100 Privacy Framework',
          'NIST Identity Verification Standards'
        ],
        regulations: [
          'Financial Intelligence Centre Act (FICA)',
          'Protection of Personal Information Act (POPIA)',
          'Anti-Money Laundering (AML) Regulations',
          'Know Your Customer (KYC) Requirements'
        ]
      },
      
      rolesAndResponsibilities: [
        {
          role: 'User',
          responsibilities: [
            'Provide valid, unexpired government-issued ID',
            'Ensure document photo is clear and complete',
            'Verify extracted information accuracy',
            'Consent to data processing'
          ],
          requiredSkills: ['Basic digital literacy', 'Access to camera/scanner']
        },
        {
          role: 'AI Document Processor',
          responsibilities: [
            'Perform OCR on uploaded documents',
            'Extract required identity fields',
            'Validate document authenticity',
            'Flag suspicious documents for review'
          ],
          requiredSkills: ['Document processing', 'Pattern recognition', 'Data extraction']
        },
        {
          role: 'Compliance Officer',
          responsibilities: [
            'Review flagged verifications',
            'Ensure regulatory compliance',
            'Approve or reject verifications',
            'Maintain audit trails'
          ],
          requiredSkills: ['Regulatory knowledge', 'Risk assessment', 'Decision making']
        },
        {
          role: 'System Administrator',
          responsibilities: [
            'Maintain system security',
            'Ensure data encryption',
            'Monitor system performance',
            'Generate compliance reports'
          ],
          requiredSkills: ['System administration', 'Security management', 'Reporting']
        }
      ],
      
      procedures: [
        {
          stepNumber: 1,
          name: 'Document Upload',
          description: 'User uploads a clear photo of their government-issued ID document',
          responsible: 'User',
          inputs: ['Government-issued ID document', 'Camera or scanner access'],
          outputs: ['Uploaded document image'],
          tools: ['Mobile camera', 'Scanner', 'File upload interface'],
          duration: '2-3 minutes',
          decisionPoints: [
            {
              condition: 'File size exceeds 10MB',
              truePath: 'Compress image and retry',
              falsePath: 'Proceed to AI processing'
            }
          ]
        },
        {
          stepNumber: 2,
          name: 'AI Document Processing',
          description: 'AI system processes the uploaded document using OCR and computer vision',
          responsible: 'AI Document Processor',
          inputs: ['Uploaded document image'],
          outputs: ['OCR results', 'Document quality score'],
          tools: ['OCR engine', 'Computer vision models', 'Image processing libraries'],
          duration: '10-20 seconds',
          decisionPoints: [
            {
              condition: 'Document quality score < 70%',
              truePath: 'Request user to re-upload clearer image',
              falsePath: 'Continue to data extraction'
            }
          ]
        },
        {
          stepNumber: 3,
          name: 'Extract Identity Fields',
          description: 'Extract and validate required identity fields from the processed document',
          responsible: 'AI Document Processor',
          inputs: ['OCR results', 'Field mapping rules'],
          outputs: ['Structured identity data', 'Extraction confidence scores'],
          tools: ['NLP models', 'Field extraction algorithms', 'Validation rules'],
          duration: '5-10 seconds',
          decisionPoints: [
            {
              condition: 'Required fields missing',
              truePath: 'Flag for manual review',
              falsePath: 'Proceed to user verification'
            }
          ]
        },
        {
          stepNumber: 4,
          name: 'User Verification',
          description: 'Present extracted data to user for verification and correction',
          responsible: 'User',
          inputs: ['Extracted identity data'],
          outputs: ['User-confirmed data', 'Corrections if any'],
          tools: ['Verification interface', 'Edit forms'],
          duration: '1-2 minutes'
        },
        {
          stepNumber: 5,
          name: 'Document Authenticity Check',
          description: 'Verify document authenticity using security features and databases',
          responsible: 'AI Document Processor',
          inputs: ['Document image', 'Extracted data', 'Security feature templates'],
          outputs: ['Authenticity score', 'Risk assessment'],
          tools: ['Security feature detection', 'Database verification APIs', 'Risk scoring engine'],
          duration: '5-15 seconds',
          decisionPoints: [
            {
              condition: 'Authenticity score < 80%',
              truePath: 'Flag for compliance officer review',
              falsePath: 'Proceed to data storage'
            },
            {
              condition: 'Document on fraud watchlist',
              truePath: 'Immediate rejection and alert',
              falsePath: 'Continue processing'
            }
          ]
        },
        {
          stepNumber: 6,
          name: 'Secure Data Storage',
          description: 'Encrypt and store verified identity information in secure database',
          responsible: 'System Administrator',
          inputs: ['Verified identity data', 'Encryption keys'],
          outputs: ['Encrypted data record', 'Storage confirmation'],
          tools: ['Encryption service', 'Secure database', 'Audit logger'],
          duration: '2-5 seconds'
        },
        {
          stepNumber: 7,
          name: 'Compliance Review',
          description: 'Compliance officer reviews flagged cases and makes final decision',
          responsible: 'Compliance Officer',
          inputs: ['Flagged verification', 'Risk assessment', 'User history'],
          outputs: ['Approval/rejection decision', 'Review notes'],
          tools: ['Compliance dashboard', 'Risk assessment tools', 'Decision logger'],
          duration: '5-30 minutes (if required)',
          decisionPoints: [
            {
              condition: 'Verification approved',
              truePath: 'Mark as verified and notify user',
              falsePath: 'Reject and provide reason to user'
            }
          ]
        },
        {
          stepNumber: 8,
          name: 'Process Completion',
          description: 'Finalize the verification process and update user status',
          responsible: 'System Administrator',
          inputs: ['Final verification status', 'Process data'],
          outputs: ['Updated user status', 'Completion notification', 'Audit trail'],
          tools: ['Notification service', 'Status updater', 'Audit logger'],
          duration: '1-2 seconds'
        }
      ],
      
      metadata: {
        version: '1.0',
        effectiveDate: new Date('2025-01-17'),
        reviewDate: new Date('2025-07-17'), // 6 months from now
        owner: 'Compliance Department',
        approvedBy: 'Chief Compliance Officer',
        changeHistory: [
          {
            version: '1.0',
            date: new Date('2025-01-17'),
            changes: 'Initial SOP creation from existing process',
            changedBy: 'System Migration'
          }
        ]
      }
    };

    // Update the process with the SOP structure
    process.standardOperatingProcedure = sop;
    await process.save();
    
    console.log('✅ Successfully added SOP structure to Identity Verification process\n');
    
    // Display summary
    console.log('📊 SOP Summary:');
    console.log(`- Procedures: ${sop.procedures.length} steps`);
    console.log(`- Roles: ${sop.rolesAndResponsibilities.length}`);
    console.log(`- Compliance Standards: ${sop.policies.compliance.length}`);
    console.log(`- Version: ${sop.metadata.version}`);
    console.log(`- Owner: ${sop.metadata.owner}`);

  } catch (error) {
    console.error('❌ Error migrating SOP structure:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateIdentityVerificationSOP();