#!/usr/bin/env tsx

/**
 * Demo script to show structured data extraction in conversations
 * This demonstrates how the AI assistant returns both human-readable
 * and machine-readable responses.
 */

import { generateSystemPrompt, createFieldExtractionPrompt, ProcessContext } from '../app/lib/ai-prompts';

console.log('=== Structured Data Extraction Demo ===\n');

// Example 1: ID Document Extraction
console.log('1. ID Document Extraction Example:');
console.log('--------------------------------');
const idContext: ProcessContext = {
  processId: 'identity-verification',
  processName: 'Capture ID Document',
  executionModel: 'sop',
  domainId: 'maven-hub'
};

console.log('System Prompt:');
console.log(generateSystemPrompt(idContext));
console.log('\n');

console.log('User Message: "I have uploaded my ID card. Please extract the information."');
console.log('\nExpected AI Response:');
console.log(`
I have successfully extracted the following information from your ID document:

**Personal Details:**
- Full Name: Sarah Johnson
- ID Number: 9501015080084
- Date of Birth: January 1, 1995
- Nationality: South African
- Gender: Female

\`\`\`json
{
  "fields": {
    "firstName": "Sarah",
    "lastName": "Johnson",
    "idNumber": "9501015080084",
    "dateOfBirth": "1995-01-01",
    "nationality": "South African",
    "gender": "Female"
  },
  "validation": {
    "idNumberValid": true,
    "documentExpired": false,
    "allFieldsExtracted": true
  },
  "metadata": {
    "extractionConfidence": 0.98,
    "documentType": "National ID Card",
    "processedAt": "${new Date().toISOString()}"
  }
}
\`\`\`

The document has been successfully verified. All required fields have been extracted with high confidence.
`);

// Example 2: Savings Calculation
console.log('\n\n2. Savings Goal Calculation Example:');
console.log('-----------------------------------');
const savingsContext: ProcessContext = {
  processId: 'savings-goal-planning',
  processName: 'Savings Goal Planning',
  executionModel: 'form',
  domainId: 'wealth-on-wheels'
};

console.log('User Message: "I want to save R50,000 in 2 years with 5% annual interest"');
console.log('\nExpected AI Response:');
console.log(`
Based on your savings goal, I have calculated the following plan:

**Savings Plan Summary:**
- Target Amount: R50,000
- Time Period: 24 months
- Annual Interest Rate: 5%
- Required Monthly Deposit: R1,989.47

**Breakdown:**
- Total Deposits: R47,747.28 (24 × R1,989.47)
- Interest Earned: R2,252.72
- Final Amount: R50,000.00

\`\`\`json
{
  "fields": {
    "targetAmount": 50000,
    "monthlyDeposit": 1989.47,
    "totalDeposits": 47747.28,
    "interestEarned": 2252.72,
    "finalAmount": 50000.00,
    "numberOfMonths": 24,
    "annualInterestRate": 0.05
  },
  "projections": {
    "month6": 12089.23,
    "month12": 24579.89,
    "month18": 37483.45,
    "month24": 50000.00
  },
  "feasibility": {
    "achievable": true,
    "requiredIncomePercentage": 15.9,
    "riskLevel": "low"
  }
}
\`\`\`

This savings plan is achievable with consistent monthly deposits. The interest compounds monthly, helping you reach your goal faster.
`);

// Example 3: Vehicle Compliance Checklist
console.log('\n\n3. Vehicle Compliance Checklist Example:');
console.log('---------------------------------------');
console.log('User Message: "Check if my vehicle meets all compliance requirements"');
console.log('\nExpected AI Response:');
console.log(`
I have completed the vehicle compliance check. Here are the results:

**Compliance Status: ✅ PASSED**

**Checklist Results:**
- Vehicle Registration: ✅ Valid until 2025-12-31
- Insurance Coverage: ✅ Comprehensive coverage active
- Roadworthy Certificate: ✅ Valid until 2024-08-15
- License Disk: ✅ Current
- Safety Equipment: ✅ All items present
- Emission Standards: ✅ Euro 5 compliant

\`\`\`json
{
  "checklistItems": [
    {"item": "vehicleRegistration", "status": "passed", "validUntil": "2025-12-31"},
    {"item": "insuranceCoverage", "status": "passed", "type": "comprehensive"},
    {"item": "roadworthyCertificate", "status": "passed", "validUntil": "2024-08-15"},
    {"item": "licenseDisk", "status": "passed", "current": true},
    {"item": "safetyEquipment", "status": "passed", "items": ["triangle", "firstAid", "fireExtinguisher"]},
    {"item": "emissionStandards", "status": "passed", "level": "Euro5"}
  ],
  "overallCompliance": true,
  "nextActions": [
    {
      "action": "Renew roadworthy certificate",
      "dueDate": "2024-08-15",
      "priority": "medium"
    }
  ],
  "complianceScore": 100
}
\`\`\`

Your vehicle meets all compliance requirements. Remember to renew your roadworthy certificate before August 15, 2024.
`);

console.log('\n\n=== Key Benefits ===');
console.log('1. Human-readable content for users to understand');
console.log('2. Machine-readable JSON for programmatic processing');
console.log('3. Structured data can be extracted and used in forms');
console.log('4. Validation results are clear and actionable');
console.log('5. Process automation becomes possible with structured outputs');

console.log('\n=== Implementation Notes ===');
console.log('- The chat interface automatically detects JSON code blocks');
console.log('- Users can copy individual field values or entire JSON');
console.log('- Extracted data can populate forms automatically');
console.log('- Validation errors are highlighted for user correction');
console.log('- The AI maintains context throughout the conversation');