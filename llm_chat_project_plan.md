# Project Plan: Multi-Model LLM Chat Platform
Using Assistant-UI + MCP, Supabase Auth, Supabase Postgres (JSONB), and a Unified TypeScript Backend

---

## 1. Project Overview

This project aims to build a multi-model LLM chat platform with the following capabilities:

- User authentication through Supabase (email and Google OAuth)
- Web client powered by Assistant-UI + MCP for rich, component-based chat interfaces
- Unified backend implemented in TypeScript using the same Next.js application
- Chat history stored in Supabase Postgres using JSONB for structured messages
- Support for multiple LLM providers selected dynamically by the user
- Real-time message streaming
- Cross-device synchronization via authenticated accounts
- Support for renderable UI components defined through MCP

Both frontend and backend will be deployed in a single unified environment using Vercel.

---

## 2. Tech Stack

### Frontend
- Next.js (React, TypeScript)
- Assistant-UI
- MCP client implementation
- Supabase Auth for login and session management
- TailwindCSS

### Backend
- Next.js API Routes or Vercel Serverless Functions written in TypeScript
- Integrations with LLM providers (OpenAI, Anthropic, Groq, etc.)
- SSE-based streaming response handlers
- Custom MCP server for UI components

### Database
- Supabase Postgres
- JSONB columns for message content
- RLS (Row-Level Security) for user-based data isolation

### Deployment
- Vercel deployment for frontend and backend
- Supabase for database, auth, and storage

---

## 3. Core Features

1. User authentication via email and Google
2. Assistant-UI based chat interface
3. Threaded conversation system
4. Persistent JSONB message storage
5. Multi-model message generation
6. Real-time token streaming
7. Renderable UI components via MCP
8. Cross-device chat history access
9. Secure per-user thread isolation

---

## 4. Data Model

### Table: threads
```
id (uuid, primary key)
user_id (uuid, foreign key)
title (text)
created_at (timestamptz)
updated_at (timestamptz)
```

### Table: messages
```
id (uuid, primary key)
thread_id (uuid, foreign key)
role (text: user | assistant | system)
content (jsonb)
model_name (text)
sequence_index (integer)
created_at (timestamptz)
```

### Example JSONB content
```
[
  { "type": "text", "text": "Hello" },
  { "type": "html", "html": "<strong>Driver Options</strong>" },
  { "type": "code", "language": "python", "code": "print('ping g430')" },
  { "type": "ui-element", "component": "ClubCard", "props": { "name": "G430 Max" } }
]
```

---

## 5. System Architecture

1. User loads the Next.js application
2. Supabase Auth handles login and returns a session token
3. Assistant-UI sends user messages to backend API routes
4. Backend validates Supabase JWT, associates data with the correct user
5. Backend stores user messages in Postgres
6. Backend calls LLM provider and streams tokens back
7. MCP server generates structured content blocks
8. Assistant message is saved in Postgres
9. Assistant-UI receives updated message list and renders it

---

## 6. Implementation Phases

### Phase 1: Base Setup
1. Initialize a Next.js TypeScript project
2. Connect application to Supabase
3. Configure email and Google OAuth
4. Initialize database schema (threads, messages)

### Phase 2: Chat UI
1. Add Assistant-UI to the project
2. Implement ChatRenderer for structured content types
3. Implement thread list page and new thread creation
4. Implement thread detail page with message list
5. Connect Supabase queries to thread pages

### Phase 3: Backend Pipeline
1. Implement API route for sending user messages
2. Verify JWT and store message in Postgres
3. Call selected LLM model
4. Stream tokens to frontend using SSE
5. Implement basic MCP server logic
6. Store assistant messages

### Phase 4: MCP Integration
1. Extend MCP server
2. Implement custom UI components
3. Expand message schema to support additional component types

### Phase 5: Production Hardening
1. Enable RLS in Supabase
2. Add pagination or lazy loading for long threads
3. Add rate limiting
4. Add error handling and monitoring
5. Deploy unified Next.js app to Vercel
6. Configure environment variables

---

## 7. API Endpoints

### Threads
```
GET /api/threads
POST /api/threads
GET /api/threads/:id
DELETE /api/threads/:id
```

### Chat
```
GET /api/threads/:id/messages
POST /api/chat/send
POST /api/chat/stream
```

Authentication is enforced using Supabase JWTs.

---

## 8. Security Considerations

- Validate JWT on every API request
- Sanitize HTML blocks returned by MCP
- RLS enforcement on Postgres tables
- Rate limit message generation
- Prevent unauthorized access to thread IDs
- Store LLM API keys securely in Vercel

---

## 9. Deployment Checklist

### Application
- Deploy entire Next.js app on Vercel
- Ensure all API routes are serverless functions
- Configure environment variables through Vercel dashboard

### Database
- Enable backups in Supabase
- Add indexes for:
  - thread_id
  - user_id
  - sequence_index

---

## 10. Optional Enhancements

- File uploads
- Image generation
- Conversation embedding search
- Multi-agent workflows
- Shared team workspaces
- Token-based billing
- Thread tagging and organization