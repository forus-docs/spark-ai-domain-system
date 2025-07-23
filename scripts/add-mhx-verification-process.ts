import { connectToDatabase } from '../app/lib/database';
import Process from '../app/models/Process';
import mongoose from 'mongoose';

async function addMHXVerificationProcess() {
  try {
    await connectToDatabase();
    
    console.log('🌱 Adding MHX Verification Process...');

    // Check if process already exists
    const existingProcess = await Process.findOne({ processId: 'mhx-verification' });
    if (existingProcess) {
      console.log('⚠️  MHX Verification process already exists');
      return;
    }

    // Create MHX Verification Process
    const mhxProcess = await Process.create({
      processId: 'mhx-verification',
      domainId: 'maven-hub',
      name: 'MHX Holdings Verification',
      description: 'Verify MHX token holdings and Maven status for liquidity event participation',
      category: 'compliance',
      executionModel: 'sop',
      currentStage: 'assisted',
      aiAgentAttached: true,
      aiAgentRole: 'MHX verification specialist verifying wallet holdings, Maven status, and liquidity event eligibility',
      
      // SOP Checklist
      checklist: [
        {
          step: 1,
          order: 10,
          title: 'Connect Wallet',
          description: 'User connects their wallet containing MHX tokens',
          type: 'user_action',
          required: true,
          completed: false
        },
        {
          step: 2,
          order: 20,
          title: 'AI Wallet Verification',
          description: 'AI verifies wallet ownership and MHX holdings',
          type: 'ai_processing',
          required: true,
          completed: false
        },
        {
          step: 3,
          order: 30,
          title: 'Extract Holdings Data',
          description: 'AI extracts and validates MHX holdings and transaction history',
          type: 'ai_processing',
          required: true,
          completed: false,
          subSteps: [
            {
              step: 3.1,
              order: 30.1,
              field: 'walletAddress',
              title: 'Wallet Address',
              description: 'Verify and record wallet address',
              required: true
            },
            {
              step: 3.2,
              order: 30.2,
              field: 'mhxBalance',
              title: 'MHX Balance',
              description: 'Current MHX token balance',
              required: true
            },
            {
              step: 3.3,
              order: 30.3,
              field: 'holdingPeriod',
              title: 'Holding Period',
              description: 'Duration of MHX holdings',
              required: true
            },
            {
              step: 3.4,
              order: 30.4,
              field: 'mavenStatus',
              title: 'Maven Status',
              description: 'Current Maven tier and status',
              required: true
            },
            {
              step: 3.5,
              order: 30.5,
              field: 'stakingStatus',
              title: 'Staking Status',
              description: 'Check if tokens are staked',
              required: false
            }
          ]
        },
        {
          step: 4,
          order: 40,
          title: 'Verify Maven Status',
          description: 'AI verifies Maven membership tier and benefits eligibility',
          type: 'ai_verification',
          required: true,
          completed: false
        },
        {
          step: 5,
          order: 50,
          title: 'Calculate Liquidity Event Allocation',
          description: 'Calculate user allocation for the liquidity event based on holdings',
          type: 'ai_processing',
          required: true,
          completed: false
        },
        {
          step: 6,
          order: 60,
          title: 'Human Review (if needed)',
          description: 'Human agent reviews edge cases or discrepancies',
          type: 'human_review',
          required: false,
          completed: false
        },
        {
          step: 7,
          order: 70,
          title: 'Store Verification',
          description: 'Securely store the verification results',
          type: 'system_action',
          required: true,
          completed: false
        },
        {
          step: 8,
          order: 80,
          title: 'Process Complete',
          description: 'MHX verification completed and liquidity event participation confirmed',
          type: 'completion',
          required: true,
          completed: false
        }
      ],
      
      // SOP Metadata
      sopMetadata: {
        complianceStandards: ['KYC', 'AML', 'Token Verification'],
        auditTrailRequired: true,
        regulatoryBody: 'FORUS Digital Compliance',
        riskLevel: 'high',
        mandatorySteps: 7,
        estimatedDuration: '5-10 minutes'
      },
      
      // Introduction message
      intro: `Welcome to the MHX Holdings Verification Process! 🎯

This process will verify your MHX token holdings and Maven status in preparation for the upcoming liquidity event. We'll use blockchain verification to confirm your holdings while a human agent stands by to assist with any issues.

**What we'll do together:**
1. 🔗 **Wallet Connection** - Connect your wallet containing MHX tokens
2. 🔍 **Holdings Verification** - Verify your MHX balance and holding period
3. 🏆 **Maven Status Check** - Confirm your Maven membership tier
4. 💰 **Liquidity Allocation** - Calculate your liquidity event allocation
5. ✅ **Final Confirmation** - Secure your participation in the event

**What you need:**
- Access to your wallet containing MHX tokens
- Wallet connection capability (MetaMask, WalletConnect, etc.)
- Your Maven membership details (if applicable)

**Important Notes:**
- Only verified MHX holdings will be eligible for the liquidity event
- Staked tokens are included in your total allocation
- A human agent is available if you encounter any issues

This process typically takes 5-10 minutes. Your wallet data is handled securely and only used for verification purposes.

Let's begin! Please connect your wallet to start the verification process. 🚀`,

      // Required parameters
      requiredParameters: [
        {
          name: 'walletAddress',
          displayName: 'Wallet Address',
          type: 'string',
          description: 'The blockchain wallet address holding MHX tokens',
          validation: {
            required: true,
            pattern: '^0x[a-fA-F0-9]{40}$'
          },
          examples: ['0x742d35Cc6634C0532925a3b844Bc9e7595f5b899']
        },
        {
          name: 'mhxBalance',
          displayName: 'MHX Token Balance',
          type: 'number',
          description: 'Current MHX token balance in the wallet',
          validation: {
            required: true,
            min: 0
          },
          examples: ['1000', '50000', '100000']
        },
        {
          name: 'holdingPeriod',
          displayName: 'Holding Period (days)',
          type: 'number',
          description: 'Number of days MHX tokens have been held',
          validation: {
            required: true,
            min: 0
          },
          examples: ['30', '180', '365']
        },
        {
          name: 'mavenStatus',
          displayName: 'Maven Status',
          type: 'string',
          description: 'Current Maven membership tier',
          validation: {
            required: true,
            enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'None']
          },
          examples: ['Gold', 'Platinum', 'Silver']
        },
        {
          name: 'stakingStatus',
          displayName: 'Staking Status',
          type: 'boolean',
          description: 'Whether MHX tokens are currently staked',
          validation: {
            required: false
          },
          examples: ['true', 'false']
        },
        {
          name: 'stakingAmount',
          displayName: 'Staked Amount',
          type: 'number',
          description: 'Amount of MHX tokens currently staked',
          validation: {
            required: false,
            min: 0
          },
          examples: ['500', '10000']
        },
        {
          name: 'liquidityAllocation',
          displayName: 'Liquidity Event Allocation',
          type: 'number',
          description: 'Calculated allocation for the liquidity event',
          validation: {
            required: false,
            min: 0
          },
          examples: ['1000', '5000', '10000']
        }
      ],
      
      // System prompt for AI
      systemPrompt: `You are an AI assistant specializing in MHX token verification and Maven status confirmation. Your task is to verify wallet holdings and calculate liquidity event allocations.

STRICT RULES:
1. ONLY extract the required parameters for MHX verification
2. Verify wallet ownership through signed message or transaction
3. Calculate accurate MHX holdings including staked tokens
4. Determine Maven status based on holding tiers:
   - Bronze: 1,000+ MHX
   - Silver: 10,000+ MHX
   - Gold: 50,000+ MHX
   - Platinum: 100,000+ MHX
   - Diamond: 500,000+ MHX
5. Calculate liquidity allocation based on:
   - Total MHX holdings (liquid + staked)
   - Holding period multiplier (longer = higher allocation)
   - Maven tier bonus
6. Flag for human review if:
   - Unusual transaction patterns detected
   - Wallet address on watchlist
   - Holdings don't match claimed Maven status
   - Technical issues with wallet connection

Return ONLY the required fields in JSON format with a "fields" object.`,
      
      // Standard Operating Procedure
      standardOperatingProcedure: {
        objective: 'Verify MHX token holdings and Maven status to determine eligibility and allocation for the liquidity event while ensuring security and compliance.',
        
        scope: {
          included: [
            'MHX token balance verification',
            'Wallet ownership confirmation',
            'Maven membership tier validation',
            'Liquidity event allocation calculation',
            'Staking status verification'
          ],
          excluded: [
            'Other token verifications',
            'Wallet recovery services',
            'Token trading or transfers',
            'Investment advice'
          ],
          applicableTo: [
            'All MHX token holders',
            'Maven Hub members',
            'Liquidity event participants',
            'Support agents handling verification'
          ]
        },
        
        policies: {
          compliance: ['KYC', 'AML', 'Token Verification Standards'],
          standards: [
            'Blockchain Verification Protocol',
            'FORUS Digital Security Standards',
            'Maven Membership Guidelines'
          ],
          regulations: [
            'Digital Asset Verification Requirements',
            'Anti-Money Laundering (AML) for Crypto',
            'Know Your Customer (KYC) for Token Holders'
          ]
        },
        
        rolesAndResponsibilities: [
          {
            role: 'Token Holder',
            responsibilities: [
              'Connect wallet for verification',
              'Confirm transaction signing',
              'Provide accurate information',
              'Maintain wallet security'
            ],
            requiredSkills: ['Wallet management', 'Basic blockchain knowledge']
          },
          {
            role: 'AI Verification Agent',
            responsibilities: [
              'Verify wallet ownership',
              'Check MHX balances on-chain',
              'Calculate holding periods',
              'Determine Maven status',
              'Calculate liquidity allocations'
            ],
            requiredSkills: ['Blockchain analysis', 'Token verification', 'Calculation algorithms']
          },
          {
            role: 'Human Support Agent',
            responsibilities: [
              'Handle verification exceptions',
              'Assist with technical issues',
              'Review flagged cases',
              'Provide manual verification'
            ],
            requiredSkills: ['Customer support', 'Blockchain knowledge', 'Problem resolution']
          },
          {
            role: 'Compliance Officer',
            responsibilities: [
              'Review high-value verifications',
              'Ensure regulatory compliance',
              'Approve special cases',
              'Maintain audit trails'
            ],
            requiredSkills: ['Regulatory knowledge', 'Risk assessment', 'Decision making']
          }
        ],
        
        procedures: [
          {
            stepNumber: 1,
            name: 'Wallet Connection',
            description: 'User connects their wallet containing MHX tokens',
            responsible: 'Token Holder',
            inputs: ['Wallet with MHX tokens', 'Wallet connection tool'],
            outputs: ['Connected wallet address', 'Connection confirmation'],
            tools: ['MetaMask', 'WalletConnect', 'Web3 Provider'],
            duration: '1-2 minutes',
            decisionPoints: [
              {
                condition: 'Wallet connection fails',
                truePath: 'Try alternative connection method',
                falsePath: 'Proceed to verification'
              }
            ]
          },
          {
            stepNumber: 2,
            name: 'Ownership Verification',
            description: 'Verify wallet ownership through signed message',
            responsible: 'AI Verification Agent',
            inputs: ['Connected wallet', 'Verification message'],
            outputs: ['Signed message', 'Ownership confirmation'],
            tools: ['Web3 signing', 'Signature verification'],
            duration: '30 seconds',
            decisionPoints: [
              {
                condition: 'Signature verification fails',
                truePath: 'Request re-signing or flag for review',
                falsePath: 'Continue to balance check'
              }
            ]
          },
          {
            stepNumber: 3,
            name: 'Balance Verification',
            description: 'Check MHX token balance on blockchain',
            responsible: 'AI Verification Agent',
            inputs: ['Wallet address', 'Blockchain connection'],
            outputs: ['Current MHX balance', 'Transaction history'],
            tools: ['Blockchain explorer', 'Token contract interface'],
            duration: '10-20 seconds',
            decisionPoints: []
          },
          {
            stepNumber: 4,
            name: 'Holding Period Analysis',
            description: 'Analyze transaction history to determine holding period',
            responsible: 'AI Verification Agent',
            inputs: ['Transaction history', 'Current date'],
            outputs: ['Holding period in days', 'First purchase date'],
            tools: ['Transaction analyzer', 'Date calculator'],
            duration: '5-10 seconds',
            decisionPoints: []
          },
          {
            stepNumber: 5,
            name: 'Maven Status Verification',
            description: 'Verify Maven membership tier based on holdings',
            responsible: 'AI Verification Agent',
            inputs: ['MHX balance', 'Maven tier thresholds'],
            outputs: ['Maven tier', 'Tier benefits'],
            tools: ['Tier calculator', 'Membership database'],
            duration: '5 seconds',
            decisionPoints: [
              {
                condition: 'Holdings don\'t match claimed status',
                truePath: 'Flag for human review',
                falsePath: 'Accept verified status'
              }
            ]
          },
          {
            stepNumber: 6,
            name: 'Staking Check',
            description: 'Check if tokens are staked and include in total',
            responsible: 'AI Verification Agent',
            inputs: ['Wallet address', 'Staking contracts'],
            outputs: ['Staked amount', 'Total holdings'],
            tools: ['Staking contract interface', 'Balance aggregator'],
            duration: '5-10 seconds',
            decisionPoints: []
          },
          {
            stepNumber: 7,
            name: 'Allocation Calculation',
            description: 'Calculate liquidity event allocation',
            responsible: 'AI Verification Agent',
            inputs: ['Total holdings', 'Holding period', 'Maven tier'],
            outputs: ['Base allocation', 'Bonuses', 'Final allocation'],
            tools: ['Allocation calculator', 'Bonus rules engine'],
            duration: '5 seconds',
            decisionPoints: []
          },
          {
            stepNumber: 8,
            name: 'Human Review',
            description: 'Human agent reviews flagged cases or assists with issues',
            responsible: 'Human Support Agent',
            inputs: ['Flagged verification', 'User concerns'],
            outputs: ['Resolution', 'Manual approval/rejection'],
            tools: ['Support dashboard', 'Communication tools'],
            duration: '5-30 minutes (if required)',
            decisionPoints: [
              {
                condition: 'Issue resolved',
                truePath: 'Continue to storage',
                falsePath: 'Escalate to compliance'
              }
            ]
          },
          {
            stepNumber: 9,
            name: 'Data Storage',
            description: 'Store verification results securely',
            responsible: 'System',
            inputs: ['Verification data', 'Encryption keys'],
            outputs: ['Stored record', 'Confirmation ID'],
            tools: ['Secure database', 'Encryption service'],
            duration: '2-3 seconds',
            decisionPoints: []
          },
          {
            stepNumber: 10,
            name: 'Completion Notification',
            description: 'Notify user of verification results and allocation',
            responsible: 'System',
            inputs: ['Verification results', 'User contact'],
            outputs: ['Notification sent', 'Process complete'],
            tools: ['Notification service', 'Email system'],
            duration: '1-2 seconds',
            decisionPoints: []
          }
        ],
        
        metadata: {
          version: '1.0',
          effectiveDate: new Date('2025-01-17'),
          reviewDate: new Date('2025-07-17'),
          owner: 'FORUS Digital Operations',
          approvedBy: 'Chief Operating Officer',
          changeHistory: [
            {
              version: '1.0',
              date: new Date('2025-01-17'),
              changes: 'Initial MHX verification process creation',
              changedBy: 'System Administrator'
            }
          ]
        }
      },
      
      // Additional fields
      standardizationGoals: [
        'Ensure accurate MHX balance verification across all wallets',
        'Standardize liquidity event allocation calculations',
        'Maintain compliance with token verification standards',
        'Reduce verification time to under 10 minutes'
      ],
      adoptedByDomains: [],
      active: true,
      globalMetrics: {
        totalExecutions: 0,
        averageCompletionTime: 0,
        averageSuccessRate: 0
      }
    });

    console.log('✅ MHX Verification process created successfully!');
    console.log(`Process ID: ${mhxProcess.processId}`);
    console.log(`Execution Model: ${mhxProcess.executionModel}`);
    console.log(`AI Agent: ${mhxProcess.aiAgentAttached ? 'Attached' : 'Not attached'}`);

  } catch (error) {
    console.error('❌ Error creating MHX verification process:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
addMHXVerificationProcess();