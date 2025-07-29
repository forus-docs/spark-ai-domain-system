# @chatscope/chat-ui-kit-react Implementation Plan

## Step 1: UI Library Migration (Execute First)

> **Note**: This is Step 1 of the CHATSCOPE upgrade. This plan focuses on migrating the existing chat UI to use @chatscope components while maintaining all current functionality. After completing this plan, proceed to Step 2 (CHATSCOPE_SPRINT_PLAN.md) to add WhatsApp-style attachment features.

## Executive Summary

This document outlines a careful, step-by-step plan to upgrade the chat interface using @chatscope/chat-ui-kit-react while maintaining 100% of the existing AI Assistant functionality. The implementation follows a progressive enhancement approach with rollback capabilities at each stage.

## Critical Requirements

### MUST Preserve:
1. **SSE Streaming** - Real-time AI responses must continue working
2. **File Uploads** - PDF and image upload functionality
3. **Token Tracking** - Cost calculation and token counting
4. **Task Context** - Task snapshot and execution flow
5. **Custom Features**:
   - "/" command for domain tasks
   - Copy/Download chat functionality
   - Task snapshot viewer (Code icon)
   - SOP and Info popups
6. **Authentication** - JWT token flow
7. **Message Persistence** - MongoDB storage

### Architecture Principles:
- **No Breaking Changes** - Each phase must be independently deployable
- **Feature Flags** - Toggle between old and new UI
- **Data Layer Unchanged** - No modifications to MongoDB schemas
- **API Layer Unchanged** - No modifications to existing endpoints
- **Progressive Enhancement** - Add features incrementally

## Implementation Phases

### Phase 0: Preparation & Safety Net (2 hours)
**Goal**: Set up infrastructure for safe implementation

1. **Create Feature Flag**
   ```typescript
   // app/lib/features.ts
   export const FEATURES = {
     USE_CHATSCOPE_UI: process.env.NEXT_PUBLIC_USE_CHATSCOPE === 'true'
   };
   ```

2. **Duplicate Current Chat Component**
   - Copy `chat-interface-v2.tsx` → `chat-interface-legacy.tsx`
   - Create wrapper component that switches based on feature flag

3. **Set Up Transformation Layer**
   ```typescript
   // app/lib/chat-transformers.ts
   export function toChatscopeMessage(msg: IExecutionMessage, currentUserId: string): MessageModel
   export function fromChatscopeInput(input: string): Partial<IExecutionMessage>
   ```

4. **Testing Checklist**
   - [ ] Existing chat works with feature flag OFF
   - [ ] Can toggle between implementations
   - [ ] No console errors

### Phase 1: Basic Container Structure (3 hours)
**Goal**: Replace outer containers while keeping core functionality

1. **Import Chatscope Styles**
   ```typescript
   // app/layout.tsx
   import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
   ```

2. **Replace Container Components**
   ```typescript
   // Keep all existing state and logic
   <MainContainer>
     <ChatContainer>
       {/* Existing header */}
       {/* Phase 2: MessageList */}
       {/* Existing input */}
     </ChatContainer>
   </MainContainer>
   ```

3. **Maintain Existing Features**
   - Keep custom header with all buttons
   - Keep existing message rendering
   - Keep existing input handling

4. **Testing Checklist**
   - [ ] Chat renders correctly
   - [ ] All buttons work (Copy, Download, Code, SOP, Info, Close)
   - [ ] Responsive layout maintained
   - [ ] No style conflicts

### Phase 2: Message Display Migration (4 hours)
**Goal**: Implement MessageList and Message components

1. **Create Message Transformer**
   ```typescript
   function transformMessage(
     msg: IExecutionMessage,
     prevMsg: IExecutionMessage | null,
     nextMsg: IExecutionMessage | null,
     currentUserId: string
   ): MessageModel {
     return {
       message: msg.content,
       sentTime: format(msg.createdAt, 'HH:mm'),
       sender: msg.role === 'assistant' ? 'AI Assistant' : 'You',
       direction: msg.userId === currentUserId ? 'outgoing' : 'incoming',
       position: calculatePosition(msg, prevMsg, nextMsg),
       type: determineMessageType(msg)
     };
   }
   ```

2. **Implement MessageList**
   ```typescript
   <MessageList>
     {messages.map((msg, index) => (
       <Message
         key={msg.id}
         model={transformMessage(msg, messages[index-1], messages[index+1], userId)}
       >
         {/* Custom content for special messages */}
         {msg.isStreaming && <TypingIndicator />}
       </Message>
     ))}
   </MessageList>
   ```

3. **Preserve Streaming Behavior**
   - Keep SSE connection logic unchanged
   - Update streaming messages in real-time
   - Show typing indicator during streaming

4. **Testing Checklist**
   - [ ] Messages display correctly
   - [ ] User/AI messages are distinguished
   - [ ] Timestamps show properly
   - [ ] Streaming works with typing indicator
   - [ ] File upload previews work
   - [ ] Message grouping is correct

### Phase 3: Enhanced Message Features (3 hours)
**Goal**: Add avatars, status indicators, and better formatting

1. **Add Avatar Component**
   ```typescript
   <Message.Avatar>
     <Avatar
       src={msg.role === 'assistant' ? '/ai-avatar.png' : userAvatar}
       name={msg.role === 'assistant' ? 'AI' : userName}
     />
   </Message.Avatar>
   ```

2. **Implement Message Status**
   - Sent indicator
   - Token count badge
   - Error states

3. **Support Multi-part Messages**
   - Images
   - Code blocks
   - File attachments

4. **Testing Checklist**
   - [ ] Avatars display correctly
   - [ ] Status indicators work
   - [ ] Multi-part messages render
   - [ ] Markdown rendering preserved

### Phase 4: Input Enhancement (3 hours)
**Goal**: Upgrade input while maintaining all functionality

1. **Replace Input Component**
   ```typescript
   <MessageInput
     placeholder="Type your message..."
     attachButton={false} // Use our custom file upload
     onSend={handleSend}
     onChange={handleInputChange}
     value={input}
   />
   ```

2. **Preserve "/" Command**
   ```typescript
   const handleInputChange = (value: string) => {
     setInput(value);
     if (value === '/' && value.length === 1) {
       setShowTasksDrawer(true);
     }
   };
   ```

3. **Maintain File Upload**
   - Keep existing `FileUploadSimple` component
   - Position next to MessageInput
   - Preserve drag-and-drop

4. **Testing Checklist**
   - [ ] Text input works
   - [ ] "/" command triggers task drawer
   - [ ] File upload works (drag and click)
   - [ ] Send on Enter works
   - [ ] Input clears after send

### Phase 5: Advanced UI Features (2 hours)
**Goal**: Add conversation header and polish

1. **Implement ConversationHeader**
   ```typescript
   <ConversationHeader>
     <ConversationHeader.Content
       userName={masterTaskName}
       info={executionModel}
     />
     <ConversationHeader.Actions>
       {/* All existing action buttons */}
     </ConversationHeader.Actions>
   </ConversationHeader>
   ```

2. **Add Message Separators**
   - Time-based separators
   - "New messages" separator

3. **Implement Smooth Scrolling**
   - Auto-scroll on new messages
   - Maintain scroll position during streaming

4. **Testing Checklist**
   - [ ] Header displays correctly
   - [ ] All action buttons work
   - [ ] Separators appear appropriately
   - [ ] Scrolling behavior is smooth

### Phase 6: Performance & Polish (2 hours)
**Goal**: Optimize and finalize

1. **Performance Optimizations**
   - Memoize message transformations
   - Virtualize long message lists
   - Optimize re-renders

2. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - Focus management

3. **Final Polish**
   - Loading states
   - Error boundaries
   - Smooth transitions

4. **Testing Checklist**
   - [ ] Performance with 100+ messages
   - [ ] Keyboard navigation works
   - [ ] No memory leaks
   - [ ] Smooth animations

## Rollback Plan

Each phase can be rolled back independently:

1. **Feature Flag Rollback**
   ```bash
   NEXT_PUBLIC_USE_CHATSCOPE=false npm run dev
   ```

2. **Code Rollback**
   - Each phase is in separate commits
   - Can revert to any previous phase
   - Legacy component remains untouched

## Testing Strategy

### Automated Tests
- Unit tests for transformers
- Integration tests for message flow
- E2E tests for critical paths

### Manual Testing Checklist
- [ ] Send text message
- [ ] Receive AI response
- [ ] Upload image
- [ ] Upload PDF
- [ ] Use "/" command
- [ ] Copy chat
- [ ] Download chat
- [ ] View task snapshot
- [ ] View SOP
- [ ] Token counting works
- [ ] Cost calculation works
- [ ] Workstream chat works
- [ ] Error handling works

## Risk Mitigation

1. **Data Integrity**
   - No database changes
   - All transformations are read-only
   - Original data structure preserved

2. **Feature Parity**
   - Feature flag for instant rollback
   - Side-by-side testing
   - User acceptance testing

3. **Performance**
   - Monitor bundle size
   - Profile render performance
   - Load test with many messages

## Success Criteria

- [ ] All existing features work identically
- [ ] No regression in AI functionality
- [ ] Improved visual consistency
- [ ] Better message grouping
- [ ] Enhanced user experience
- [ ] No increase in errors
- [ ] Performance maintained or improved

## Timeline

- **Phase 0**: 2 hours (Day 1 morning)
- **Phase 1**: 3 hours (Day 1 afternoon)
- **Phase 2**: 4 hours (Day 2 morning)
- **Phase 3**: 3 hours (Day 2 afternoon)
- **Phase 4**: 3 hours (Day 3 morning)
- **Phase 5**: 2 hours (Day 3 afternoon)
- **Phase 6**: 2 hours (Day 4 morning)
- **Testing & Refinement**: 3 hours (Day 4 afternoon)

**Total**: 22 hours (4 days)

## Dependencies

- @chatscope/chat-ui-kit-react (already installed)
- @chatscope/chat-ui-kit-styles (already installed)
- No additional dependencies required

## Post-Implementation

1. Remove feature flag after successful deployment
2. Delete legacy component after 2 weeks
3. Document new component architecture
4. Train team on new UI kit
5. **Proceed to Step 2**: Execute CHATSCOPE_SPRINT_PLAN.md for WhatsApp-style features

---

**Document Version**: 1.1  
**Last Updated**: January 2025  
**Author**: Implementation Team  
**Status**: Ready for Review  
**Execution Order**: Step 1 of 2 (Complete this before CHATSCOPE_SPRINT_PLAN.md)