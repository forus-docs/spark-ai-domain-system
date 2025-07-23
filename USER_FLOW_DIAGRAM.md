# User Flow Diagrams

## 1. Authentication & Domain Selection Flow

```mermaid
graph TD
    A[User Visits App] --> B{Authenticated?}
    B -->|No| C{First Visit?}
    C -->|Yes| D[Register Page]
    C -->|No| E[Login Page]
    D --> F[Create Account]
    E --> G[Login]
    F --> H[JWT Token Generated]
    G --> H
    H --> I[Store in localStorage]
    I --> J{Has Domain?}
    B -->|Yes| J
    J -->|No| K[Domains Page]
    J -->|Yes| L[Home Page]
    K --> M[Browse Domains]
    M --> N[Join Domain Modal]
    N --> O[Select Role]
    O --> P[Identity Verification]
    P --> Q[Confirmation]
    Q --> R[Domain Joined]
    R --> L
```

## 2. PostJourney to Chat Flow

```mermaid
graph TD
    A[Home Page] --> B[UserPosts Display]
    B --> C[User Clicks Post]
    C --> D{Post has ProcessId?}
    D -->|No| E[Navigate to Target]
    D -->|Yes| F[Check Process]
    F --> G{AI Assisted?}
    G -->|No| E
    G -->|Yes| H[Create/Get Conversation]
    H --> I[Build SOP Context]
    I --> J[Navigate to Chat]
    J --> K[Load Chat Interface]
    K --> L[SSE Connection]
    L --> M[AI Streaming Response]
```

## 3. Context Provider Data Flow

```mermaid
graph LR
    A[AuthProvider] --> B[User & Token State]
    B --> C[DomainProvider]
    C --> D[Domain Selection State]
    D --> E[ChatProvider]
    E --> F[Chat Sessions]
    F --> G[FileProvider]
    G --> H[File Uploads]
    
    B -.->|Provides User| I[All Components]
    D -.->|Filters Content| J[Navigation & Posts]
    F -.->|Manages| K[Conversations]
```

## 4. SOP Context Assembly

```mermaid
graph TD
    A[UserPost Click] --> B[POST /api/posts/id/conversation]
    B --> C[Load Process]
    C --> D{Has SOP?}
    D -->|Yes| E[Extract SOP Fields]
    D -->|No| F[Use Basic Context]
    E --> G[Build System Prompt]
    F --> G
    G --> H[Add Objective & Scope]
    H --> I[Add Compliance Standards]
    I --> J[Add Procedures & Roles]
    J --> K[Add Decision Points]
    K --> L[Add Required Parameters]
    L --> M[Create Conversation]
    M --> N[Return to Client]
```

## 5. Component Hierarchy

```
RootLayout
│
├── Providers (Context Wrappers)
│   ├── AuthProvider
│   ├── DomainProvider
│   ├── ChatProvider
│   └── FileProvider
│
└── AppLayout
    ├── ProtectedRoute (Auth Guard)
    ├── SparkAppBar (Header)
    ├── Sidebar (Navigation)
    └── Page Content
        ├── Home (PostCards)
        ├── Domains (DomainCards)
        ├── Chat (ChatInterface)
        └── Other Pages
```

## 6. Database Relationships

```mermaid
erDiagram
    USER ||--o{ USER_DOMAIN : "belongs to"
    USER ||--o{ USER_POST : "assigned"
    USER ||--o{ CONVERSATION : "owns"
    USER ||--o{ API_KEY : "has"
    
    DOMAIN ||--o{ USER_DOMAIN : "has members"
    DOMAIN ||--o{ POST : "contains"
    
    POST ||--o{ USER_POST : "assigned as"
    POST ||--o| PROCESS : "links to"
    
    PROCESS ||--o{ CONVERSATION : "guides"
    
    USER_POST ||--o| CONVERSATION : "creates"
    
    CONVERSATION ||--o{ MESSAGE : "contains"
```

## 7. API Request Flow

```
Client Request
    ↓
Middleware (Auth Check)
    ↓
Route Handler
    ↓
Database Query
    ↓
Business Logic
    ↓
Response Transform
    ↓
Client Response
```

## 8. State Synchronization

```mermaid
graph TD
    A[User Action] --> B[Update Local State]
    B --> C[API Call]
    C --> D[Database Update]
    D --> E[Response]
    E --> F[Update Context]
    F --> G[Re-render Components]
    
    H[localStorage] --> I[Persist Key Data]
    I --> J[Restore on Reload]
```