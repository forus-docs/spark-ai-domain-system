import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { connectToDatabase } from '@/app/lib/database';
import UserPost from '@/app/models/UserPost';
import Post from '@/app/models/Post';
import Process from '@/app/models/Process';
import { ConversationService } from '@/app/services/conversations';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    postId: string;
  };
}

/**
 * GET /api/posts/[postId]/conversation
 * Get or create a conversation for a UserPost with AI-assisted process
 */
export async function POST(request: NextRequest, context: RouteContext) {
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const userId = decoded.id;

    const { postId } = context.params;

    console.log('Creating conversation for post:', postId);
    console.log('User ID:', userId);

    // Get the UserPost
    const userPost = await UserPost.findById(postId);
    console.log('UserPost found:', !!userPost);
    console.log('UserPost processId:', userPost?.processId);
    
    if (!userPost || userPost.userId !== userId) {
      console.log('UserPost not found or wrong user');
      return NextResponse.json({ error: 'UserPost not found' }, { status: 404 });
    }

    // Check if UserPost has a processId
    if (!userPost.processId) {
      console.log('No processId in UserPost');
      return NextResponse.json({ error: 'No process associated with this post' }, { status: 400 });
    }

    // Get the Process to check if it's AI-assisted
    const process = await Process.findOne({ processId: userPost.processId });
    console.log('Process found:', !!process);
    if (!process) {
      console.log('Process not found for processId:', userPost.processId);
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    if (!process.aiAgentAttached) {
      return NextResponse.json({ error: 'Process is not AI-assisted' }, { status: 400 });
    }

    // Get the Post for additional context
    const post = await Post.findById(userPost.postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check for existing conversations for this UserPost
    const existingConversations = await ConversationService.getUserPostConversations(
      userPost._id.toString()
    );

    let conversation;

    if (existingConversations.length > 0) {
      // Return the most recent conversation
      conversation = existingConversations[0];
      console.log(`Found existing conversation: ${conversation.conversationId}`);
    } else {
      // Build comprehensive system prompt using SOP as source of truth
      let systemPrompt = process.systemPrompt || `You are an AI assistant helping with the ${process.name} process.`;
      
      // If SOP exists, use it as the primary context source
      if (process.standardOperatingProcedure) {
        const sop = process.standardOperatingProcedure;
        
        systemPrompt += `\n\n## STANDARD OPERATING PROCEDURE (SOP)`;
        
        // Add objective and scope
        systemPrompt += `\n\n### Objective\n${sop.objective}`;
        
        if (sop.scope) {
          systemPrompt += `\n\n### Scope`;
          if (sop.scope.included && sop.scope.included.length > 0) {
            systemPrompt += `\n\n**Included:**`;
            sop.scope.included.forEach((item: string) => {
              systemPrompt += `\n- ${item}`;
            });
          }
          if (sop.scope.excluded && sop.scope.excluded.length > 0) {
            systemPrompt += `\n\n**Excluded:**`;
            sop.scope.excluded.forEach((item: string) => {
              systemPrompt += `\n- ${item}`;
            });
          }
          if (sop.scope.applicableTo && sop.scope.applicableTo.length > 0) {
            systemPrompt += `\n\n**Applicable To:**`;
            sop.scope.applicableTo.forEach((item: string) => {
              systemPrompt += `\n- ${item}`;
            });
          }
        }
        
        // Add policies and compliance
        if (sop.policies) {
          systemPrompt += `\n\n### Policies & Compliance`;
          if (sop.policies.compliance && sop.policies.compliance.length > 0) {
            systemPrompt += `\n\n**Compliance Standards:** ${sop.policies.compliance.join(', ')}`;
          }
          if (sop.policies.standards && sop.policies.standards.length > 0) {
            systemPrompt += `\n**Standards:** ${sop.policies.standards.join(', ')}`;
          }
          if (sop.policies.regulations && sop.policies.regulations.length > 0) {
            systemPrompt += `\n**Regulations:** ${sop.policies.regulations.join(', ')}`;
          }
        }
        
        // Add roles and responsibilities
        if (sop.rolesAndResponsibilities && sop.rolesAndResponsibilities.length > 0) {
          systemPrompt += `\n\n### Roles & Responsibilities`;
          sop.rolesAndResponsibilities.forEach((role: any) => {
            systemPrompt += `\n\n**${role.role}:**`;
            if (role.responsibilities && role.responsibilities.length > 0) {
              role.responsibilities.forEach((resp: string) => {
                systemPrompt += `\n- ${resp}`;
              });
            }
          });
        }
        
        // Add detailed procedures
        if (sop.procedures && sop.procedures.length > 0) {
          systemPrompt += `\n\n### Procedures`;
          sop.procedures.forEach((proc: any) => {
            systemPrompt += `\n\n**Step ${proc.stepNumber}: ${proc.name}**`;
            systemPrompt += `\n- Description: ${proc.description}`;
            systemPrompt += `\n- Responsible: ${proc.responsible}`;
            systemPrompt += `\n- Duration: ${proc.duration}`;
            
            if (proc.decisionPoints && proc.decisionPoints.length > 0) {
              systemPrompt += `\n- Decision Points:`;
              proc.decisionPoints.forEach((dp: any) => {
                systemPrompt += `\n  - If ${dp.condition}: ${dp.truePath} / Else: ${dp.falsePath}`;
              });
            }
          });
        }
        
        // Add SOP metadata for context
        if (process.sopMetadata) {
          systemPrompt += `\n\n### Additional Context`;
          if (process.sopMetadata.complianceStandards) {
            systemPrompt += `\n- Compliance: ${process.sopMetadata.complianceStandards.join(', ')}`;
          }
          if (process.sopMetadata.riskLevel) {
            systemPrompt += `\n- Risk Level: ${process.sopMetadata.riskLevel}`;
          }
          if (process.sopMetadata.estimatedDuration) {
            systemPrompt += `\n- Estimated Duration: ${process.sopMetadata.estimatedDuration}`;
          }
        }
      } else {
        // Fallback to basic process information if no SOP
        systemPrompt += `\n\nProcess Information:
- Process Name: ${process.name}
- Description: ${process.description}
- Execution Model: ${process.executionModel}
- Current Stage: ${process.currentStage}
- AI Role: ${process.aiAgentRole || 'General assistance'}`;

        // Add checklist if available and no SOP
        if (process.checklist && process.checklist.length > 0) {
          systemPrompt += '\n\nProcess Checklist:';
          process.checklist.forEach((item: any) => {
            systemPrompt += `\n${item.step}. ${item.title} - ${item.description}`;
            if (item.subSteps) {
              item.subSteps.forEach((subStep: any) => {
                systemPrompt += `\n  ${subStep.step}. ${subStep.title}`;
              });
            }
          });
        }
      }
      
      // Add required parameters if available
      if (process.requiredParameters && process.requiredParameters.length > 0) {
        systemPrompt += `\n\n### Required Information`;
        systemPrompt += `\nYou must collect the following information:`;
        process.requiredParameters.forEach((param: any) => {
          systemPrompt += `\n- ${param.displayName} (${param.name}): ${param.description}`;
          if (param.validation) {
            if (param.validation.required) {
              systemPrompt += ` [REQUIRED]`;
            }
            if (param.validation.minLength || param.validation.maxLength) {
              systemPrompt += ` [Length: ${param.validation.minLength || 0}-${param.validation.maxLength || 'unlimited'}]`;
            }
          }
        });
      }
      
      // Add intro message if available
      if (process.intro) {
        systemPrompt += `\n\n### Introduction Message for Users\n${process.intro}`;
      }

      // Add post context at the end
      systemPrompt += `\n\n### Current Task Context
- Title: ${post.title}
- Description: ${post.description}
- Type: ${post.postType}
- Priority: ${post.priority || 'normal'}`;

      // Create a new conversation with enriched context
      conversation = await ConversationService.createConversation({
        userId,
        title: post.title,
        domainId: post.domain === 'all' ? undefined : post.domain,
        processId: process.processId,
        processName: process.name,
        executionModel: process.executionModel,
        userPostId: userPost._id.toString(),
        model: 'gemini-1.5-flash', // Default model
        systemPrompt: systemPrompt,
      });
      console.log(`Created new conversation: ${conversation.conversationId}`);
    }

    // Return conversation info
    return NextResponse.json({
      conversationId: conversation.conversationId,
      isNew: existingConversations.length === 0,
      process: {
        id: process.processId,
        name: process.name,
        executionModel: process.executionModel,
        aiAgentRole: process.aiAgentRole,
        intro: process.intro, // Include intro message
      },
    });
  } catch (error) {
    console.error('Error handling conversation request:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation request' },
      { status: 500 }
    );
  }
}