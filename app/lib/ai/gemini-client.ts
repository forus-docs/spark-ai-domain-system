import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Use GOOGLE_API_KEY as the primary env variable (matching LibreChat)
const apiKey = process.env.GOOGLE_API_KEY || '';
console.log('Initializing Gemini with API key exists:', !!apiKey);
console.log('API Key first 10 chars:', apiKey.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(apiKey);

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: Array<{
    mimeType: string;
    data: string; // base64 encoded
  }>;
}

export interface ProcessInfo {
  masterTaskId?: string;
  processName?: string;
  executionModel?: string;
  domainId?: string;
}

export async function* streamGeminiResponse(
  messages: ChatMessage[],
  systemPrompt?: string,
  processContext?: string
) {
  try {
    console.log('Gemini API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey.length);
    console.log('Messages count:', messages.length);
    console.log('Has System Prompt:', !!systemPrompt);
    console.log('Has Process Context:', !!processContext);
    
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }
    
    // TECHNICAL DEBT: Model is hardcoded to gemini-1.5-flash
    // Should support multiple models based on process configuration:
    // - gemini-1.5-flash (current default)
    // - gemini-1.5-pro
    // - gemini-2.0-flash (when available)
    // - Other providers (OpenAI, Anthropic) via different clients
    // Each process should be able to specify its preferred model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build the conversation history
    let chatHistory: Array<{ 
      role: string; 
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> 
    }> = [];
    
    // Add system prompt and process context if provided
    let contextualPrompt = '';
    if (systemPrompt) {
      contextualPrompt = systemPrompt + '\n\n';
    }
    if (processContext) {
      contextualPrompt += `Process Context:\n${processContext}\n\n`;
    }

    // Convert messages to Gemini format, filtering out initial assistant messages
    // Filter out intro messages and messages that start a conversation
    const filteredMessages = messages.filter((msg, index) => {
      // Keep all user messages
      if (msg.role === 'user') return true;
      
      // Filter out first assistant message if it's an intro/welcome
      if (msg.role === 'assistant' && index === 0) {
        const lowerContent = msg.content.toLowerCase();
        if (lowerContent.includes('welcome') || 
            lowerContent.includes('hello') || 
            lowerContent.includes('i\'ll help you') ||
            lowerContent.includes('i will help you') ||
            lowerContent.includes('process')) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log('Filtered messages:', filteredMessages.map(m => ({ role: m.role, content: m.content.substring(0, 50) })));
    
    for (const message of filteredMessages) {
      if (message.role === 'system') {
        // Prepend system messages to the context
        contextualPrompt += message.content + '\n\n';
      } else {
        // Build parts array with text and images
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        
        // Add text content
        if (message.content) {
          parts.push({ text: message.content });
        }
        
        // Add images if present
        if (message.images && message.images.length > 0) {
          for (const image of message.images) {
            parts.push({
              inlineData: {
                mimeType: image.mimeType,
                data: image.data
              }
            });
          }
        }
        
        // Only add non-empty parts
        if (parts.length > 0) {
          chatHistory.push({
            role: message.role === 'user' ? 'user' : 'model',
            parts: parts as any, // Type assertion needed for multimodal parts
          });
        }
      }
    }

    // If we have context, prepend it to the first user message
    if (contextualPrompt && chatHistory.length > 0 && chatHistory[0].role === 'user' && chatHistory[0].parts[0].text) {
      chatHistory[0].parts[0].text = contextualPrompt + chatHistory[0].parts[0].text;
    }

    console.log('Chat history before validation:', chatHistory.map(h => ({ 
      role: h.role, 
      partsCount: h.parts.length,
      firstPartType: h.parts[0] ? (h.parts[0].text ? 'text' : 'image') : 'empty'
    })));
    
    // Ensure first message is from user
    if (chatHistory.length === 0) {
      console.error('Chat history is empty after filtering');
      throw new Error('No valid messages to send to Gemini');
    }
    
    // If first message is not from user, we need to fix this
    if (chatHistory[0].role !== 'user') {
      console.warn('First message is not from user, fixing chat history...');
      
      // Find the first user message
      const firstUserIndex = chatHistory.findIndex(msg => msg.role === 'user');
      
      if (firstUserIndex === -1) {
        console.error('No user messages found in chat history');
        throw new Error('No user messages found');
      }
      
      // Remove all messages before the first user message
      chatHistory = chatHistory.slice(firstUserIndex);
      console.log('Fixed chat history, removed', firstUserIndex, 'messages');
    }

    // Start a chat session
    const chat = model.startChat({
      history: chatHistory.slice(0, -1) as any, // All messages except the last one
      generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Get the last message to send
    const lastMessage = chatHistory[chatHistory.length - 1];
    const result = await chat.sendMessageStream(lastMessage.parts as any);

    // Stream the response
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error('Gemini API error details:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error) {
      // Check for specific API errors
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY environment variable.');
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Google API quota exceeded. Please try again later.');
      }
      if (error.message.includes('model not found')) {
        throw new Error('Gemini model not available. Please check the model name.');
      }
    }
    
    throw error;
  }
}

export async function getGeminiResponse(
  messages: ChatMessage[],
  systemPrompt?: string,
  processContext?: string
): Promise<string> {
  let fullResponse = '';
  for await (const chunk of streamGeminiResponse(messages, systemPrompt, processContext)) {
    fullResponse += chunk;
  }
  return fullResponse;
}