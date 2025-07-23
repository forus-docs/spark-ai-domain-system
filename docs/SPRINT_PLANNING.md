# Sprint Planning Document - Spark AI Domain System

**Last Updated**: January 23, 2025

## Sprint Overview

### Sprint 1: Domain System MVP ✅ COMPLETE
- Domain browsing and selection
- Role-based domain joining
- Process template cards
- Chat interface (simulated)
- Recent chats tracking
- Mobile-first responsive design

### Sprint 2: LibreChat Integration ✅ COMPLETE
- JWT-based authentication
- User registration/login
- API key management
- SSE chat streaming
- MongoDB data migration
- Chat conversation management

### Sprint 3: Yellowcard Marketplace ⏳ ACTIVE
- Business wallet integration
- Internal ledger system
- Task monetization
- Micropayment infrastructure
- Revenue distribution

### Sprint 4: Contact Picker & Invitations 🔒 BLOCKED
**Status**: Blocked by Google Auth implementation  
**Priority**: High  
**Estimated Duration**: 2 weeks

#### Overview
Implement contact access functionality to enable users to easily invite team members to domains using their device contacts or Google contacts.

#### User Stories
1. As a domain admin, I want to invite team members from my contacts
2. As a user, I want to import contacts from Google to invite colleagues
3. As a user, I want to manually enter email addresses if contact access is unavailable
4. As a user, I want to see the status of my sent invitations

#### Technical Requirements

**Phase 1: Foundation**
- [ ] Implement Google OAuth 2.0 authentication (BLOCKER)
- [ ] Set up OAuth consent screen
- [ ] Configure People API access
- [ ] Store OAuth tokens securely

**Phase 2: Contact Access**
- [ ] Implement Contact Picker API for mobile browsers
- [ ] Add Google People API integration
- [ ] Create manual email entry fallback
- [ ] Build contact selection UI

**Phase 3: Invitation System**
- [ ] Create invitation data model
- [ ] Build invitation API endpoints
- [ ] Implement invitation email system
- [ ] Add invitation tracking/status

**Phase 4: UI/UX**
- [ ] Update left drawer "Invite Member" functionality
- [ ] Create invitation flow screens
- [ ] Add invitation management dashboard
- [ ] Implement permission request flows

#### Dependencies & Blockers

**Critical Blocker**: Google OAuth Implementation
- Required for Google People API access
- Needed for secure authentication flow
- Enables future Google Workspace integrations

**Additional Dependencies**:
- Email service configuration (SendGrid/AWS SES)
- Privacy policy updates for contact access
- Terms of service updates

#### Technical Architecture

```
┌─────────────────────────┐
│   Invitation Flow       │
├─────────────────────────┤
│  1. Contact Selection   │
│  ├─ Contact Picker API  │
│  ├─ Google People API   │
│  └─ Manual Entry        │
├─────────────────────────┤
│  2. Invitation Creation │
│  ├─ Validate Contacts   │
│  ├─ Create Invitations  │
│  └─ Send Emails         │
├─────────────────────────┤
│  3. Invitation Tracking │
│  ├─ Status Updates      │
│  ├─ Resend Options      │
│  └─ Analytics           │
└─────────────────────────┘
```

#### Acceptance Criteria
- [ ] Users can access contacts via Contact Picker API on supported browsers
- [ ] Users can import Google contacts after OAuth authentication
- [ ] Manual email entry works as fallback
- [ ] Invitations are sent successfully
- [ ] Invitation status is tracked and displayed
- [ ] Privacy compliance is maintained

#### Security Considerations
- One-time contact access (no persistent storage without consent)
- OAuth tokens encrypted at rest
- Rate limiting on invitation sending
- GDPR compliance for contact data

#### Estimated Story Points
- Google OAuth Setup: 8 points
- Contact Picker Implementation: 5 points
- Google People API Integration: 8 points
- Invitation System Backend: 13 points
- UI/UX Implementation: 8 points
- Testing & Security: 5 points

**Total: 47 story points**

---

## Future Sprints (Tentative)

### Sprint 5: Advanced Process Execution
- Form execution model
- Knowledge base integration
- BPMN workflow engine
- Training module system

### Sprint 6: Analytics & Reporting
- Domain analytics dashboard
- Process completion metrics
- User engagement tracking
- Revenue analytics (for Sprint 3)

### Sprint 7: Mobile Native App
- React Native/Expo setup
- Native contact access
- Push notifications
- Offline capability

---

## Notes

- Sprint 4 (Contact Picker) cannot begin until Google OAuth is implemented
- Consider implementing Google OAuth as part of Sprint 3 to unblock Sprint 4
- Contact Picker provides significant UX improvement for team onboarding
- Privacy and security are critical for contact access features