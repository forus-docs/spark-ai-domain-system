# LibreChat Integration for Spark AI Domain System

## Overview

This document describes the integration of LibreChat's authentication and chat streaming capabilities into the Spark AI Domain System for Sprint 2.

## What Was Implemented

### 1. Authentication System
- **JWT-based authentication** with access and refresh tokens
- **User model** with MongoDB integration
- **Login and registration pages** with Spark's minimalist design
- **Auth context provider** for managing user state across the app
- **API endpoints** for authentication:
  - `/api/auth/login` - User login
  - `/api/auth/register` - User registration

### 2. API Key Management
- **API key storage** in user model with encryption support
- **CRUD operations** for API keys
- **API endpoints**:
  - `GET /api/keys` - List user's API keys
  - `POST /api/keys` - Create new API key
  - `DELETE /api/keys` - Delete API key
- **UI component** (`ApiKeysPanel`) for managing keys

### 3. Chat Streaming with SSE
- **Server-Sent Events (SSE)** implementation for real-time chat
- **Enhanced chat interface** (`ChatInterfaceV2`) with:
  - Real-time message streaming
  - Authentication support
  - Process context awareness
  - Graceful fallback for demo mode
- **Streaming API endpoint** at `/api/chat/stream`

### 4. Integration with Existing Domain System
- **Auth provider** added to root layout
- **Process cards** now launch authenticated chat sessions
- **Chat sessions** tracked in context with domain/process info
- **Seamless integration** with Sprint 1's immutable flow

## Key Dependencies Added

```json
{
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.16.3",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "passport-local": "^1.0.0",
  "express-session": "^1.18.1",
  "cookie-parser": "^1.4.7",
  "sse.js": "^2.6.0",
  "dotenv": "^17.2.0"
}
```

## Environment Configuration

Create a `.env.local` file with:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/spark-ai

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key

# Session Secret
SESSION_SECRET=your-session-secret

# API Keys Encryption
CREDS_KEY=your-32-character-encryption-key
CREDS_IV=your-16-character-iv

# OpenAI API (for production)
OPENAI_API_KEY=your-openai-api-key
```

## Usage

### Authentication Flow
1. User navigates to `/login` or `/register`
2. Upon successful auth, JWT tokens are generated
3. Access token stored in memory, refresh token in httpOnly cookie
4. Auth context provides user state to all components

### Chat Streaming Flow
1. User clicks a process card
2. `ChatInterfaceV2` opens with process context
3. Messages sent to `/api/chat/stream` with auth token
4. SSE connection established for real-time streaming
5. AI responses stream word-by-word to the UI

### API Key Management
1. Users can create API keys for programmatic access
2. Keys are stored encrypted in the database
3. Keys can have expiration dates
4. Full key shown only once on creation

## Demo Mode

The system works in two modes:
- **Authenticated**: Full streaming with real API calls (requires MongoDB)
- **Demo**: Simulated responses without authentication

## Next Steps for Sprint 2

1. **Connect to real AI providers** (OpenAI, Anthropic, etc.)
2. **Implement the 5 execution models**:
   - Form Model
   - SOP Model
   - Knowledge Model
   - BPMN Model
   - Training Model
3. **Add AI agent management**
4. **Implement process state persistence**
5. **Add smart contract integration**

## Security Considerations

- Passwords hashed with bcrypt
- JWT tokens with expiration
- API keys stored encrypted
- httpOnly cookies for refresh tokens
- CORS and session security configured

## Build and Deployment

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The system is ready for Sprint 2 implementation of the execution models and AI agent integration.