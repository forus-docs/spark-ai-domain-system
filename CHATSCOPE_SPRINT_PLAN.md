# @chatscope/chat-ui-kit-react Sprint Implementation Plan
## WhatsApp-Style Attachments & Enhanced Chat UI

## Step 2: WhatsApp-Style Features (Execute After Step 1)

> **Prerequisites**: This is Step 2 of the CHATSCOPE upgrade. Before starting this plan, you MUST complete Step 1 (CHATSCOPE_IMPLEMENTATION_PLAN.md) which migrates the chat UI to @chatscope components. This plan builds on top of those components to add WhatsApp-style attachment features.

### Sprint Overview
**Goal**: Upgrade chat interface with @chatscope library and implement WhatsApp-style attachment system  
**Duration**: 2-week sprint  
**Priority**: Maintain AI Assistant functionality throughout  
**Prerequisite**: CHATSCOPE_IMPLEMENTATION_PLAN.md completed

### Sprint Scope

#### In Scope:
1. @chatscope UI library integration
2. WhatsApp-style attachment menu with:
   - **File** - Documents (PDF, DOC, XLS, etc.)
   - **Photos & videos** - Media files
   - **Contact** - Contact cards
   - **Poll** - Create polls
   - **Event** - Calendar events
3. Enhanced message display for each attachment type
4. Improved file upload UX

#### Out of Scope:
- AI image generation
- Voice messages
- Location sharing
- Status updates

### Data Model Extensions

```typescript
// Extend content_parts types
type ContentPartType = 
  | 'text' 
  | 'image_url' 
  | 'code' 
  | 'file'
  | 'contact'    // NEW
  | 'poll'       // NEW
  | 'event';     // NEW

// New content part structures
interface ContactPart {
  type: 'contact';
  contact: {
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    userId?: string;  // Link to system user
  };
}

interface PollPart {
  type: 'poll';
  poll: {
    question: string;
    options: string[];
    allowMultiple: boolean;
    votes?: Record<string, string[]>; // userId -> selected options
    expiresAt?: Date;
  };
}

interface EventPart {
  type: 'event';
  event: {
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
    attendees?: string[]; // userIds
  };
}
```

## Sprint Breakdown

### Week 1: Foundation & Core UI

#### Day 1-2: Safe Foundation Setup
**Goal**: Establish feature flags and safety mechanisms

1. **Feature Flag System**
   ```typescript
   export const FEATURES = {
     USE_CHATSCOPE_UI: process.env.NEXT_PUBLIC_USE_CHATSCOPE === 'true',
     ENHANCED_ATTACHMENTS: process.env.NEXT_PUBLIC_ENHANCED_ATTACHMENTS === 'true'
   };
   ```

2. **Component Duplication**
   - Copy current chat interface as backup
   - Create switching mechanism
   - Set up transformation layer

3. **Attachment Menu Component**
   ```typescript
   // components/AttachmentMenu.tsx
   interface AttachmentMenuProps {
     isOpen: boolean;
     onClose: () => void;
     onSelect: (type: AttachmentType) => void;
   }
   ```

**Deliverables**:
- [ ] Feature flags configured
- [ ] Legacy components preserved
- [ ] Basic attachment menu UI
- [ ] Safe rollback mechanism

#### Day 3-4: @chatscope Container Integration
**Goal**: Replace outer containers while maintaining functionality

1. **Import Styles**
   ```typescript
   // Conditional import based on feature flag
   if (FEATURES.USE_CHATSCOPE_UI) {
     import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
   }
   ```

2. **Container Structure**
   - MainContainer wrapper
   - ChatContainer with custom header
   - Preserve all existing buttons

3. **Message Transformers**
   ```typescript
   function toChatscopeMessage(msg: IExecutionMessage): MessageModel
   function fromChatscopeMessage(model: MessageModel): IExecutionMessage
   ```

**Deliverables**:
- [ ] Chatscope containers integrated
- [ ] Custom header maintained
- [ ] All buttons functional
- [ ] No visual regressions

#### Day 5: Message Display Migration
**Goal**: Implement MessageList with proper message rendering

1. **Basic Message Display**
   - Text messages
   - User/AI distinction
   - Timestamps
   - Avatar support

2. **Streaming Support**
   - Typing indicator during AI response
   - Real-time content updates
   - Token count display

**Deliverables**:
- [ ] Messages display correctly
- [ ] Streaming works seamlessly
- [ ] Avatars show properly
- [ ] Message grouping works

### Week 2: Enhanced Attachments

#### Day 6-7: File & Media Attachments
**Goal**: Upgrade current file upload to WhatsApp style

1. **Attachment Button Integration**
   ```typescript
   <MessageInput
     attachButton={true}
     onAttachClick={() => setShowAttachmentMenu(true)}
   />
   ```

2. **File/Media Handlers**
   - File picker for documents
   - Media gallery for photos/videos
   - Preview before sending
   - Progress indicators

3. **Message Display**
   - File cards with icons
   - Image/video previews
   - Download buttons

**Deliverables**:
- [ ] Attachment menu opens on click
- [ ] File selection works
- [ ] Media preview functional
- [ ] Files display in chat

#### Day 8: Contact Cards
**Goal**: Implement contact sharing

1. **Contact Picker UI**
   - Search existing users
   - Manual contact entry
   - Contact preview

2. **Contact Card Component**
   ```typescript
   const ContactMessage = ({ contact }) => (
     <div className="contact-card">
       <Avatar src={contact.avatar} />
       <div>{contact.name}</div>
       <div>{contact.email}</div>
     </div>
   );
   ```

3. **Backend Support**
   - Store contact in content_parts
   - Retrieve user details if linked

**Deliverables**:
- [ ] Contact picker UI
- [ ] Contact cards display
- [ ] Click to view details
- [ ] Integration with user system

#### Day 9: Polls
**Goal**: Interactive poll functionality

1. **Poll Creator UI**
   - Question input
   - Dynamic option fields
   - Settings (multiple choice, expiry)

2. **Poll Display Component**
   ```typescript
   const PollMessage = ({ poll, onVote }) => (
     <div className="poll-container">
       <h4>{poll.question}</h4>
       {poll.options.map(option => (
         <PollOption 
           option={option}
           votes={poll.votes[option]}
           onVote={() => onVote(option)}
         />
       ))}
     </div>
   );
   ```

3. **Real-time Updates**
   - Vote via API
   - Update poll results
   - Show vote percentages

**Deliverables**:
- [ ] Poll creation UI
- [ ] Poll voting works
- [ ] Results update real-time
- [ ] Vote persistence

#### Day 10: Events
**Goal**: Calendar event creation and display

1. **Event Creator UI**
   - Title and description
   - Date/time picker
   - Location field

2. **Event Card Component**
   ```typescript
   const EventMessage = ({ event }) => (
     <div className="event-card">
       <CalendarIcon />
       <h4>{event.title}</h4>
       <div>{formatDate(event.startDate)}</div>
       <button>Add to Calendar</button>
     </div>
   );
   ```

3. **Calendar Integration**
   - Export to .ics file
   - Add to calendar links

**Deliverables**:
- [ ] Event creation form
- [ ] Event cards display
- [ ] Calendar export works
- [ ] Time zone handling

### Testing & Polish (Days 11-12)

#### Comprehensive Testing
1. **Functionality Tests**
   - [ ] All attachment types work
   - [ ] AI responses unaffected
   - [ ] File size limits enforced
   - [ ] Error handling smooth

2. **Performance Tests**
   - [ ] Large files handled
   - [ ] Many messages perform well
   - [ ] Smooth scrolling
   - [ ] Memory usage stable

3. **Cross-browser Testing**
   - [ ] Chrome/Edge
   - [ ] Firefox
   - [ ] Safari
   - [ ] Mobile browsers

#### Polish & Documentation
1. **UI Polish**
   - Smooth animations
   - Loading states
   - Error messages
   - Empty states

2. **Documentation**
   - Update user guide
   - API documentation
   - Component documentation
   - Migration guide

## Success Metrics

1. **Functionality**
   - [ ] All 5 attachment types working
   - [ ] AI chat uninterrupted
   - [ ] No data loss
   - [ ] Backward compatible

2. **Performance**
   - [ ] < 100ms attachment menu open
   - [ ] < 2s file upload start
   - [ ] Smooth 60fps scrolling
   - [ ] < 200MB memory usage

3. **User Experience**
   - [ ] Intuitive attachment flow
   - [ ] Clear visual feedback
   - [ ] Mobile responsive
   - [ ] Accessibility compliant

## Risk Mitigation

1. **Feature Flags** - Toggle any feature instantly
2. **Incremental Rollout** - Test with subset of users
3. **Rollback Plan** - Revert to legacy UI if needed
4. **Data Safety** - No schema changes, only additions
5. **Performance Monitoring** - Track metrics throughout

## Technical Considerations

### API Endpoints Needed
```typescript
// Polls
POST   /api/polls/create
POST   /api/polls/:pollId/vote
GET    /api/polls/:pollId/results

// Events
POST   /api/events/create
GET    /api/events/:eventId/export

// Contacts
GET    /api/users/search
GET    /api/users/:userId/card
```

### Component Structure
```
components/
├── chat/
│   ├── ChatInterface.tsx         # Main wrapper
│   ├── AttachmentMenu.tsx        # WhatsApp-style menu
│   ├── MessageComponents/
│   │   ├── TextMessage.tsx
│   │   ├── FileMessage.tsx
│   │   ├── MediaMessage.tsx
│   │   ├── ContactMessage.tsx
│   │   ├── PollMessage.tsx
│   │   └── EventMessage.tsx
│   └── AttachmentCreators/
│       ├── ContactPicker.tsx
│       ├── PollCreator.tsx
│       └── EventCreator.tsx
```

## Definition of Done

Each feature is complete when:
1. **Implemented** - Code complete and working
2. **Tested** - Unit and integration tests pass
3. **Documented** - User and developer docs updated
4. **Reviewed** - Code review completed
5. **Deployed** - Available behind feature flag

## Post-Sprint

1. **Monitor** - Track usage and performance
2. **Iterate** - Gather feedback and improve
3. **Extend** - Add more attachment types
4. **Optimize** - Performance improvements

---

**Sprint Start**: [To be scheduled after Step 1 completion]  
**Sprint End**: [Sprint Start + 2 weeks]  
**Team**: Frontend Developer(s)  
**Status**: Pending Step 1 Completion  
**Execution Order**: Step 2 of 2 (Requires CHATSCOPE_IMPLEMENTATION_PLAN.md completed)