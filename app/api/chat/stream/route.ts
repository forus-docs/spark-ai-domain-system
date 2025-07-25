import { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/jwt';
import { streamGeminiResponse, ChatMessage } from '@/app/lib/ai/gemini-client';
import { TaskExecutionService, ExecutionMessageService } from '@/app/services/task-executions';
import { connectToDatabase } from '@/app/lib/database';
import { generateSystemPrompt, enhanceUserMessage, ProcessContext } from '@/app/lib/ai-prompts';
import Process from '@/app/models/MasterTask';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Connect to MongoDB
  await connectToDatabase();

  // Check for authentication token
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  let userId: string;
  try {
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    userId = decoded.id; // JWT payload has 'id' field
  } catch (error) {
    console.error('Invalid auth token:', error);
    return new Response('Invalid token', { status: 401 });
  }

  const { messages, processId, processContext, systemPrompt, executionId, domainId, processName, executionModel } = await request.json();

  console.log('Chat stream request:', {
    userId,
    messagesCount: messages?.length,
    processId,
    domainId,
    executionId,
    hasProcessContext: !!processContext,
    hasSystemPrompt: !!systemPrompt
  });

  if (!messages || !Array.isArray(messages)) {
    return new Response('Messages array is required', { status: 400 });
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start streaming
  (async () => {
    let taskExecution;
    let userMessage;
    let assistantMessage;

    try {
      // Send initial connection event
      await writer.write(encoder.encode('event: connect\ndata: {"status":"connected"}\n\n'));

      // Create or get taskExecution
      console.log('Creating/getting taskExecution...');
      if (!executionId) {
        // Create new taskExecution
        console.log('Creating new taskExecution for user:', userId);
        taskExecution = await TaskExecutionService.createTaskExecution({
          userId,
          domainId,
          masterTaskId: processId,
          masterTaskName: processName,
          executionModel,
          title: messages[messages.length - 1]?.content?.substring(0, 100) || 'New Chat',
        });
        console.log('Created taskExecution:', taskExecution.executionId);
      } else {
        // Get existing taskExecution
        console.log('Getting existing taskExecution:', executionId);
        taskExecution = await TaskExecutionService.getTaskExecution(executionId);
        if (!taskExecution) {
          throw new Error('Conversation not found');
        }
        console.log('Found existing taskExecution');
      }

      // Save user message
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        userMessage = await ExecutionMessageService.createMessage({
          executionId: taskExecution.executionId,
          userId,
          role: 'user',
          content: lastUserMessage.content,
        });
        
        // Check for PostID in the message
        const postIdMatch = lastUserMessage.content.match(/\[PostID:\s*([a-zA-Z0-9_-]+)\]/);
        if (postIdMatch) {
          const postId = postIdMatch[1];
          console.log('Detected PostID in message:', postId);
          
          // Import TaskJourneyService to handle post completion properly
          const { TaskJourneyService } = await import('@/app/lib/services/task-journey.service');
          
          // Complete the post using TaskJourneyService which handles identity verification
          try {
            const result = await TaskJourneyService.completeTask({
              userId,
              userTaskId: postId,
              completionData: {
                completedViaChat: true,
                executionId: taskExecution.executionId
              }
            });
            
            if (result.success) {
              console.log('Post completed successfully:', postId);
              
              // Send special event to trigger spinner
              await writer.write(encoder.encode(`event: postCompleted\ndata: {"postId":"${postId}","status":"completed"}\n\n`));
            } else {
              console.error('Failed to complete post:', result.error);
            }
          } catch (error) {
            console.error('Failed to complete post:', error);
          }
        }
      }

      // Fetch complete process data including SOP
      let processData;
      if (processId) {
        processData = await Process.findOne({ processId });
      }
      
      // Enhance the last user message if needed
      const enhancedMessages = [...messages];
      if (enhancedMessages.length > 0 && enhancedMessages[enhancedMessages.length - 1].role === 'user') {
        const lastMessage = enhancedMessages[enhancedMessages.length - 1];
        const processCtx: ProcessContext = {
          processId: processId || '',
          processName: processName || '',
          executionModel: executionModel || '',
          domainId: domainId || '',
          requiredParameters: processData?.requiredParameters,
          standardOperatingProcedure: processData?.standardOperatingProcedure
        };
        lastMessage.content = enhanceUserMessage(lastMessage.content, processCtx);
      }

      // Convert messages to ChatMessage format
      const chatMessages: ChatMessage[] = enhancedMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        images: msg.images || undefined
      }));

      // Generate structured system prompt if we have process context
      let finalSystemPrompt: string;
      let processRequiredParameters = processData?.requiredParameters;
      
      if (processId && processName) {
        const processCtx: ProcessContext = {
          processId,
          processName,
          executionModel: executionModel || '',
          domainId: domainId || '',
          requiredParameters: processRequiredParameters,
          standardOperatingProcedure: processData?.standardOperatingProcedure
        };
        
        // Use process system prompt if available, otherwise generate one
        if (processData?.systemPrompt) {
          finalSystemPrompt = processData.systemPrompt;
          // Append required parameters info if not already in the prompt
          if (processRequiredParameters && processRequiredParameters.length > 0) {
            finalSystemPrompt += '\n\n' + generateSystemPrompt(processCtx).split('REQUIRED PARAMETERS')[1];
          }
        } else {
          finalSystemPrompt = generateSystemPrompt(processCtx);
        }
      } else {
        // Use system prompt from taskExecution or default
        finalSystemPrompt = taskExecution.systemPrompt || systemPrompt || 
          'You are a helpful AI assistant for the Spark AI Domain System.';
      }

      // Stream the Gemini response
      let fullResponse = '';
      let totalTokenCount = 0;
      let hasFieldExtraction = false;
      
      // Calculate approximate token counts and costs
      // TECHNICAL DEBT: We're using hardcoded pricing and estimated token counts
      // Instead, we should:
      // 1. Use the actual token counts from Gemini API's usageMetadata response
      // 2. Store pricing in a configuration file that can be updated
      // 3. Access the aggregated response after streaming to get accurate counts
      // Currently using rough estimates for real-time updates during streaming
      
      // Gemini 1.5 Flash pricing (as of Jan 2025)
      const COST_PER_1K_INPUT_TOKENS = 0.00015;  // $0.15 per 1M tokens
      const COST_PER_1K_OUTPUT_TOKENS = 0.0006;  // $0.60 per 1M tokens
      
      // Calculate input tokens (messages + system prompt)
      let inputTokens = 0;
      for (const msg of chatMessages) {
        // TECHNICAL DEBT: Using rough word count * 1.3 multiplier for token estimation
        // Should use actual tokenizer or API's usageMetadata
        inputTokens += Math.ceil(msg.content.split(/\s+/).length * 1.3);
      }
      inputTokens += Math.ceil(finalSystemPrompt.split(/\s+/).length * 1.3);
      
      // Get previous total from taskExecution if exists
      const previousMessages = await ExecutionMessageService.getExecutionMessages(taskExecution.executionId);
      let previousTotalTokens = 0;
      let previousTotalCost = 0;
      
      for (const msg of previousMessages) {
        if (msg.tokenCount) {
          previousTotalTokens += msg.tokenCount;
        }
      }
      
      // Calculate previous cost based on token counts
      // Rough estimate: 70% of tokens are input, 30% are output
      const previousInputTokens = Math.floor(previousTotalTokens * 0.7);
      const previousOutputTokens = previousTotalTokens - previousInputTokens;
      previousTotalCost = (previousInputTokens / 1000 * COST_PER_1K_INPUT_TOKENS) + 
                         (previousOutputTokens / 1000 * COST_PER_1K_OUTPUT_TOKENS);
      
      try {
        let chunksSent = 0;
        for await (const chunk of streamGeminiResponse(chatMessages, finalSystemPrompt, processContext)) {
          fullResponse += chunk;
          const chunkTokens = Math.ceil(chunk.split(/\s+/).length * 1.3);
          totalTokenCount += chunkTokens;
          
          // Calculate running totals
          const currentOutputTokens = totalTokenCount;
          const currentTotalTokens = previousTotalTokens + inputTokens + currentOutputTokens;
          const currentCost = previousTotalCost + 
                            (inputTokens / 1000 * COST_PER_1K_INPUT_TOKENS) +
                            (currentOutputTokens / 1000 * COST_PER_1K_OUTPUT_TOKENS);
          
          const data = JSON.stringify({
            id: Date.now().toString(),
            content: chunk,
            role: 'assistant',
            executionId: taskExecution.executionId,
            tokenCount: currentTotalTokens,
            cost: currentCost,
          });
          await writer.write(encoder.encode(`event: message\ndata: ${data}\n\n`));
          
          chunksSent++;
          
          // Check if we have field extraction with JSON and should stop streaming
          if (processRequiredParameters && processRequiredParameters.length > 0) {
            // Look for JSON code block with "fields" object
            const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
            const jsonMatch = fullResponse.match(jsonBlockRegex);
            
            if (jsonMatch) {
              try {
                const jsonContent = jsonMatch[jsonMatch.length - 1].replace(/```json\s*|\s*```/g, '');
                const parsed = JSON.parse(jsonContent);
                
                // If we have a "fields" object, we've completed field extraction
                if (parsed.fields && typeof parsed.fields === 'object') {
                  hasFieldExtraction = true;
                  // Stop streaming after this chunk
                  break;
                }
              } catch (parseError) {
                // Continue streaming if JSON parsing fails
                continue;
              }
            }
          }
        }

        // Save assistant message
        assistantMessage = await ExecutionMessageService.createMessage({
          executionId: taskExecution.executionId,
          userId,
          role: 'assistant',
          content: fullResponse,
          // TECHNICAL DEBT: Model is hardcoded, should come from process.aiModel
          model: 'gemini-1.5-flash',
          tokenCount: totalTokenCount,
          parentMessageId: userMessage?.messageId,
        });

        // Update taskExecution title if it's the first exchange
        if (messages.length <= 2) {
          const title = fullResponse.substring(0, 50) + (fullResponse.length > 50 ? '...' : '');
          await TaskExecutionService.updateTaskExecutionTitle(taskExecution.executionId, title);
        }
      } catch (apiError: any) {
        console.error('Gemini API error:', apiError);
        console.error('Error details:', apiError.message || apiError);
        console.error('Error stack:', apiError.stack);
        // Fallback to a helpful error message
        const errorMessage = `I apologize, but I encountered an error processing your request. Error: ${apiError.message || 'Unknown error'}. Please try again.`;
        
        // Save error message
        await ExecutionMessageService.createMessage({
          executionId: taskExecution.executionId,
          userId,
          role: 'assistant',
          content: errorMessage,
          parentMessageId: userMessage?.messageId,
        });
        
        const data = JSON.stringify({
          id: Date.now().toString(),
          content: errorMessage,
          role: 'assistant',
          executionId: taskExecution.executionId,
        });
        await writer.write(encoder.encode(`event: message\ndata: ${data}\n\n`));
      }

      // Send completion event
      await writer.write(encoder.encode('event: done\ndata: {"status":"completed"}\n\n'));
    } catch (error) {
      console.error('Streaming error:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'Stream failed';
      await writer.write(encoder.encode(`event: error\ndata: {"error":"${errorMessage}"}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}