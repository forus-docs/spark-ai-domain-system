# FORUS Digital Maven - Post Journey System Design

## Overview
The FORUS Digital Maven app uses a journey-based post system where posts are not displayed directly from a master collection, but are assigned to users as they progress through their Maven journey. This allows for personalized experiences, progress tracking, and user control over their home screen content.

## Core Concepts

### 1. Master Posts Collection (Shared Across All Domains)
A centralized `posts` collection in Firebase contains all available posts across all FORUS domains:

```
/posts/{postId}
├── domain: "maven" | "coop" | "business" | etc.
├── title: "Complete Your Maven Profile"
├── description: "Set up your expertise areas and availability"
├── postType: "onboarding" | "sop_update" | "achievement" | etc.
├── imageUrl: "https://firebase.../maven-profile-400x225.webp"
├── nextPosts: ["maven-sop-training", "maven-first-assignment"]
├── externalContentUrl: "https://maven.forus.digital/profile-guide"
├── navigateTo: "/profile/edit"
├── price: null | { amount: 100, currency: "USD" }
├── canHide: true
├── sopReference: { sopId: "maven-onboarding-sop", ... }
├── requiredRole: "maven" | "user" | null
├── triggerConditions: { ... }
└── metadata: { version: "1.0", author: "system" }
```

### 2. User Journey Posts (Assigned to Individual Users)
Each user has a `userPosts` subcollection containing posts assigned to them based on their journey:

```
/users/{userId}/userPosts/{userPostId}
├── postId: "reference-to-master-post"
├── assignedAt: Timestamp
├── completedAt: Timestamp | null
├── isHidden: false
├── isCompleted: false
├── interactionCount: 0
├── lastInteractionAt: Timestamp | null
├── progressData: { currentStep: 2, totalSteps: 5 }
├── journeyContext: { 
│   ├── triggeredBy: "completed-member-registration"
│   └── journeyPhase: "onboarding"
├── }
└── persistenceData: { } // JSON for form data persistence
```

## Journey Flow Example

### Maven Onboarding Journey

1. **User Signs Up**
   - System automatically assigns: "Become a Maven Member"
   - This post cannot be hidden (canHide: false)

2. **User Completes Member Registration**
   - System marks "Become a Maven Member" as completed
   - System assigns next posts based on `nextPosts` array:
     - "Complete Your Maven Profile"
     - "Maven Code of Conduct"
     - "Choose Your Expertise Areas"

3. **User Completes Profile**
   - System assigns:
     - "Maven SOP Training"
     - "Connect with Local Mavens"
   - User can now hide posts they're not interested in

4. **Ongoing Journey**
   - New posts appear based on:
     - SOP updates relevant to their expertise
     - Available Maven assignments
     - Achievement milestones
     - Community announcements

## Key Features

### 1. Progress Tracking
- Each userPost tracks completion status
- Progress data shows steps completed within multi-step posts
- Dashboard can show overall journey completion percentage

### 2. User Control
- Users can hide posts (if canHide: true)
- Hidden posts remain in userPosts but filtered from home screen
- Users can unhide posts from settings

### 3. Smart Assignment
Posts are assigned based on:
- User role and permissions
- Previous post completions
- SOP access permissions
- Time-based triggers
- Achievement unlocks

### 4. Persistence
- Form data saved in persistenceData JSON
- Users can leave and return without losing progress
- Especially important for lengthy SOP procedures

## Implementation Rules

### Post Assignment Logic
```typescript
// When assigning a post to a user:
1. Check if user meets role requirements
2. Check if user has completed prerequisites
3. Check if post already exists in userPosts
4. If not exists, create userPost document
5. If exists and was hidden, optionally unhide
6. Trigger any associated group creations
7. Send notification if appropriate
```

### Home Screen Display Filter
```typescript
// Display posts where:
- isCompleted === false
- AND isHidden === false
- ORDER BY assignedAt DESC (newest first)
- GROUP BY priority/category if needed
```

### Post Interaction Flow
```typescript
1. User taps post
2. Increment interactionCount
3. Update lastInteractionAt
4. Navigate to:
   - Internal route (navigateTo)
   - OR External content (externalContentUrl)
   - OR SOP procedure view
5. Track progress if multi-step
6. On completion:
   - Set isCompleted: true
   - Set completedAt: Timestamp
   - Assign nextPosts
   - Create any specified groups
   - Award achievements if applicable
```

## Benefits of This Approach

1. **Personalization**: Each user sees only relevant posts for their journey stage
2. **Progress Visibility**: Clear tracking of what's been completed
3. **Flexibility**: Users can hide irrelevant posts while maintaining audit trail
4. **Scalability**: Same system works across all FORUS domains (Maven, Coop, Business)
5. **Analytics**: Rich data on user journey progression and engagement
6. **Persistence**: Users never lose progress in complex procedures
7. **Audit Trail**: Complete history of what was offered and user actions

## Maven-Specific Post Types

1. **Onboarding Posts**: Profile setup, training modules
2. **SOP Posts**: New procedures, updates, completion certificates
3. **Assignment Posts**: Available Maven tasks in their area
4. **Achievement Posts**: Milestones reached, badges earned
5. **Community Posts**: Local Maven meetups, collaboration opportunities
6. **Compliance Posts**: Required training updates, policy changes

## Future Considerations

- A/B testing different journey paths
- Machine learning for optimal post timing
- Collaborative posts (requiring multiple Mavens)
- Post templates for different Maven specializations
- Integration with Maven performance metrics