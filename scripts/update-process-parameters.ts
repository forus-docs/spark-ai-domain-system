#!/usr/bin/env tsx

/**
 * Update processes with required parameters
 * This defines what fields the AI should extract from documents
 */

import mongoose from 'mongoose';
import Process from '../app/models/Process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai';

async function updateProcessParameters() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update Identity Verification process
    const identityVerification = await Process.findOneAndUpdate(
      { processId: 'identity-verification' },
      {
        $set: {
          requiredParameters: [
            {
              name: 'firstName',
              displayName: 'First Name',
              type: 'string',
              description: 'The person\'s first name or given name',
              validation: {
                required: true,
                minLength: 1,
                maxLength: 100
              },
              examples: ['John', 'Maria', 'Ahmed']
            },
            {
              name: 'lastName',
              displayName: 'Last Name',
              type: 'string',
              description: 'The person\'s last name, surname, or family name',
              validation: {
                required: true,
                minLength: 1,
                maxLength: 100
              },
              examples: ['Smith', 'García', 'van der Berg']
            },
            {
              name: 'idNumber',
              displayName: 'ID/Passport Number',
              type: 'string',
              description: 'The official document number - could be ID number, passport number, driver\'s license number, or any government-issued ID',
              validation: {
                required: true,
                minLength: 5,
                maxLength: 50
              },
              examples: ['9501015800088', 'M12345678', 'DL-123456789']
            },
            {
              name: 'dateOfBirth',
              displayName: 'Date of Birth',
              type: 'date',
              description: 'The person\'s birth date in any common format',
              validation: {
                required: true
              },
              examples: ['1990-01-15', '15 January 1990', '01/15/1990']
            },
            {
              name: 'nationality',
              displayName: 'Nationality/Country',
              type: 'string',
              description: 'The person\'s nationality or country of citizenship',
              validation: {
                required: true
              },
              examples: ['South African', 'USA', 'British', 'Indian']
            },
            {
              name: 'gender',
              displayName: 'Gender',
              type: 'string',
              description: 'The person\'s gender as stated on the document',
              validation: {
                required: false
              },
              examples: ['Male', 'Female', 'M', 'F', 'Other']
            },
            {
              name: 'documentType',
              displayName: 'Document Type',
              type: 'string',
              description: 'The type of identity document provided',
              validation: {
                required: true
              },
              examples: ['Passport', 'National ID', 'Driver\'s License', 'Residence Permit']
            },
            {
              name: 'documentExpiry',
              displayName: 'Document Expiry Date',
              type: 'date',
              description: 'The expiration date of the document if applicable',
              validation: {
                required: false
              },
              examples: ['2025-12-31', '31 December 2025']
            },
            {
              name: 'documentIssueDate',
              displayName: 'Document Issue Date',
              type: 'date',
              description: 'The date when the document was issued',
              validation: {
                required: false
              },
              examples: ['2020-01-15', '15 January 2020']
            }
          ],
          systemPrompt: `You are an AI assistant helping with identity verification. Your task is to extract ONLY the required identity information from uploaded documents.

STRICT RULES:
1. ONLY extract the 9 required parameters defined for this process
2. DO NOT extract any other information (no addresses, no photos, no extra fields)
3. Your JSON "fields" object must contain EXACTLY these parameter names:
   - firstName, lastName, idNumber, dateOfBirth, nationality, gender, documentType, documentExpiry, documentIssueDate
4. Set any missing field to null - do not omit it
5. Map document fields intelligently:
   - "Surname"/"Family Name" → lastName
   - "Given Names"/"Forenames" → firstName  
   - "ID No."/"Document Number"/"Passport No." → idNumber
   - Any date format → YYYY-MM-DD
6. Return ONLY these fields, nothing else`
        }
      },
      { new: true }
    );

    if (identityVerification) {
      console.log('✅ Updated Identity Verification process with required parameters');
      console.log(`   - Added ${identityVerification.requiredParameters?.length} parameter definitions`);
    }

    // Update Project Registration process
    const projectRegistration = await Process.findOneAndUpdate(
      { processId: 'project-registration' },
      {
        $set: {
          requiredParameters: [
            {
              name: 'projectName',
              displayName: 'Project Name',
              type: 'string',
              description: 'The official name of the project',
              validation: {
                required: true,
                minLength: 3,
                maxLength: 200
              }
            },
            {
              name: 'projectDescription',
              displayName: 'Project Description',
              type: 'string',
              description: 'A brief description of the project objectives',
              validation: {
                required: true,
                minLength: 10,
                maxLength: 1000
              }
            },
            {
              name: 'projectManager',
              displayName: 'Project Manager',
              type: 'string',
              description: 'The name of the person responsible for the project',
              validation: {
                required: true
              }
            },
            {
              name: 'startDate',
              displayName: 'Project Start Date',
              type: 'date',
              description: 'When the project is expected to begin',
              validation: {
                required: true
              }
            },
            {
              name: 'endDate',
              displayName: 'Project End Date',
              type: 'date',
              description: 'When the project is expected to complete',
              validation: {
                required: true
              }
            },
            {
              name: 'budget',
              displayName: 'Project Budget',
              type: 'number',
              description: 'The total budget allocated for the project',
              validation: {
                required: true
              }
            },
            {
              name: 'companyRegistration',
              displayName: 'Company Registration Number',
              type: 'string',
              description: 'The official registration number of the company',
              validation: {
                required: true
              }
            }
          ]
        }
      },
      { new: true }
    );

    if (projectRegistration) {
      console.log('✅ Updated Project Registration process with required parameters');
      console.log(`   - Added ${projectRegistration.requiredParameters?.length} parameter definitions`);
    }

    // Show example of how AI will use these parameters
    console.log('\n📋 Example AI Usage:');
    console.log('When a user uploads a South African ID, the AI will:');
    console.log('1. Recognize "Surname" maps to "lastName"');
    console.log('2. Recognize "Names" maps to "firstName"');
    console.log('3. Recognize "Identity Number" maps to "idNumber"');
    console.log('4. Extract and validate all fields according to the parameter definitions');
    console.log('5. Return structured JSON with the standardized field names');

    await mongoose.disconnect();
    console.log('\n✅ Process parameters update complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateProcessParameters();