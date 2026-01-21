# AI-Powered Task Manager - Design Plan
## SFL Interview Assessment (2-Hour Scope)

## Executive Summary

This document outlines the architecture for an **AI-Powered Task Manager** built specifically for the SFL interview assessment. The application demonstrates sophisticated AI integration, polished UI/UX, and reliable functionality within a 2-hour development scope.

**Core Value Proposition:**
- **Intelligent Task Management:** AI automatically categorizes, tags, and enriches tasks using OpenAI GPT-4o
- **AI Chat Assistant:** Natural conversation interface to create tasks and habits through guided AI interaction
- **Beautiful, Responsive UI:** Modern design with smooth animations and intuitive interactions
- **Zero-Configuration Setup:** Docker Compose runs everything automatically
- **Production-Ready:** Deployed and accessible via live URL

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router) with React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Node.js)
- **Database:** PostgreSQL with Prisma ORM
- **AI:** OpenAI GPT-4o for task enrichment and conversational task creation
- **Authentication:** NextAuth.js with credentials provider
- **Deployment:** Docker Compose for local, Vercel/Railway for production

**Assessment Alignment:**
- ✅ **D1 (UI/UX):** Polished design with shadcn/ui, smooth animations, thoughtful interactions
- ✅ **D2 (Complexity):** AI integration, real-time enrichment, smart categorization
- ✅ **D3 (Frontend Quality):** Zero visual bugs, responsive design, accessible components
- ✅ **D4 (Backend Quality):** Reliable API, error handling, data validation with Zod
- ✅ **D5 (Responsiveness):** Mobile-first design, works on all screen sizes
- ✅ **D6 (Performance):** Optimistic updates, efficient rendering, fast load times
- ✅ **D7 (Impressiveness):** AI-powered features, beautiful UI, one-command setup

---

## 1. Project Structure

### Simplified Folder Tree

```
ai-task-manager/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx              # Main layout with header
│   │   ├── page.tsx                # Task list dashboard
│   │   └── tasks/
│   │       ├── [id]/
│   │       │   └── page.tsx         # Task detail/edit modal
│   │       └── new/
│   │           └── page.tsx        # Quick add task
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts            # GET, POST /api/tasks
│   │   │   └── [id]/
│   │   │       └── route.ts        # GET, PATCH, DELETE /api/tasks/:id
│   │   ├── chat/                   # AI Chat API (NEW)
│   │   │   ├── conversations/
│   │   │   │   ├── route.ts        # GET, POST /api/chat/conversations
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # GET, DELETE /api/chat/conversations/:id
│   │   │   ├── message/
│   │   │   │   └── route.ts        # POST /api/chat/message
│   │   │   └── approve-plan/
│   │   │       └── route.ts        # POST /api/chat/approve-plan
│   │   └── enrich/
│   │       └── route.ts            # POST /api/enrich (AI enrichment)
│   ├── layout.tsx
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   └── skeleton.tsx
│   ├── chat/                       # AI Chat components (NEW)
│   │   ├── ChatWidget.tsx          # Floating chat widget
│   │   ├── ChatMessage.tsx         # Message bubble component
│   │   ├── PlanProposal.tsx        # Plan approval UI
│   │   └── ChatConversationList.tsx # Conversation history
│   ├── TaskCard.tsx                # Animated task card
│   ├── TaskForm.tsx                 # Create/edit form
│   ├── TaskList.tsx                 # Virtualized list
│   ├── AIEnrichmentBadge.tsx        # Shows AI processing status
│   └── EmptyState.tsx               # Beautiful empty state
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── openai.ts                    # OpenAI service (enrichment + chat)
│   ├── validations.ts               # Zod schemas (including chat schemas)
│   └── utils.ts                     # Utility functions
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker/
│   └── postgres/
│       └── init.sql
├── public/
├── .env.example
├── .env.local
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── DESIGN_PLAN.md
```

**Key Simplifications:**
- Single Next.js app (no monorepo complexity)
- Direct OpenAI API calls in API routes (no BullMQ/Redis worker)
- Simple PostgreSQL setup
- Focus on core features with maximum polish

---

## 2. Data Model

### Enhanced Schema (Multi-User with AI Chat)

The data model supports multi-user authentication, team workspaces, habits, task activities, and AI chat conversations.

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│      User       │      │   Workspace      │      │      Task       │
├─────────────────┤      ├──────────────────┤      ├─────────────────┤
│ id (PK, UUID)   │      │ id (PK, UUID)   │      │ id (PK, UUID)   │
│ email           │      │ name             │      │ userId (FK)     │
│ name            │      │ type             │      │ workspaceId (FK)│
│ passwordHash    │      │ ownerId (FK)     │      │ title           │
│ role            │      │ settings (JSONB) │      │ description     │
│ preferences     │      │ createdAt        │      │ status          │
│ createdAt       │      │ updatedAt        │      │ priority        │
└─────────────────┘      └──────────────────┘      │ category        │
       │                          │                 │ tags (JSONB)    │
       │                          │                 │ metadata (JSONB)│
       │                          │                 │ recurringRule   │
       │                          │                 │ version         │
       └──────────────────────────┼─────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
         ┌──────────▼──────────┐    ┌──────────▼──────────┐
         │  ChatConversation  │    │      Habit          │
         ├────────────────────┤    ├────────────────────┤
         │ id (PK, UUID)      │    │ id (PK, UUID)      │
         │ userId (FK)        │    │ userId (FK)        │
         │ title              │    │ name               │
         │ status             │    │ frequency          │
         │ plan (JSONB)       │    │ streak             │
         │ approvedAt         │    │ longestStreak      │
         │ createdAt          │    │ lastCompletedAt    │
         └────────────────────┘    └────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   ChatMessage       │
         ├────────────────────┤
         │ id (PK, UUID)      │
         │ conversationId (FK)│
         │ role               │
         │ content            │
         │ metadata (JSONB)   │
         │ createdAt          │
         └────────────────────┘
```

### Prisma Schema

```prisma
// User and Workspace models (existing)
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  passwordHash  String
  role          UserRole @default(USER)
  preferences   Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tasks         Task[]
  habits        Habit[]
  workspaces    WorkspaceMember[]
  conversations ChatConversation[]
  // ... other relations
}

model Workspace {
  id        String         @id @default(uuid())
  name      String
  type      WorkspaceType
  ownerId   String
  owner     User           @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  settings  Json?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  tasks     Task[]
  members   WorkspaceMember[]
}

model Task {
  id            String      @id @default(uuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspaceId   String?
  workspace     Workspace?  @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  title         String
  description   String?
  status        TaskStatus  @default(PENDING)
  priority      TaskPriority @default(MEDIUM)
  category      String?
  tags          Json?
  metadata      Json?
  recurringRule Json?
  dueDate       DateTime?
  completedAt   DateTime?
  version       Int         @default(1)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([userId, status, createdAt])
  @@index([workspaceId])
}

// AI Chat Models (NEW)
model ChatConversation {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String?  // Auto-generated from first message
  status      ChatStatus @default(ACTIVE) // ACTIVE, COMPLETED, ARCHIVED
  plan        Json?    // Proposed task/habit plan (before approval)
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  messages    ChatMessage[]

  @@index([userId, createdAt])
}

enum ChatStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

model ChatMessage {
  id             String           @id @default(uuid())
  conversationId String
  conversation   ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           MessageRole      // USER, ASSISTANT, SYSTEM
  content        String
  metadata       Json?            // For structured data (task proposals, etc.)
  createdAt      DateTime         @default(now())

  @@index([conversationId, createdAt])
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

model Habit {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  frequency       String
  streak          Int      @default(0)
  longestStreak   Int      @default(0)
  lastCompletedAt DateTime?
  metadata        Json?
  createdAt       DateTime @default(now())

  @@index([userId])
}
```

**Enums:**
- `UserRole`: `USER`, `ADMIN`
- `WorkspaceType`: `PERSONAL`, `TEAM`
- `TaskStatus`: `PENDING`, `IN_PROGRESS`, `COMPLETED`
- `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`
- `ChatStatus`: `ACTIVE`, `COMPLETED`, `ARCHIVED` (NEW)
- `MessageRole`: `USER`, `ASSISTANT`, `SYSTEM` (NEW)

**Key Features:**
- Multi-user support with authentication
- Team workspaces for collaboration
- AI chat conversations for task/habit creation
- Habit tracking with streaks
- Task versioning for sync
- JSONB fields for flexible metadata
- Comprehensive indexes for performance

---

## 3. AI Integration Strategy

### Simplified Approach (No Queue System)

**Direct API Integration:**
- OpenAI API called directly from Next.js API route
- Async processing: Task created immediately, enrichment happens in background
- Client polls for enrichment status or uses optimistic updates

**Flow:**
```
User Creates Task
    ↓
Task Saved to DB (immediate)
    ↓
API Route Calls OpenAI (async)
    ↓
Enrichment Data Saved to Task
    ↓
Client Updates UI (optimistic)
```

### OpenAI Service

**Location:** `lib/openai.ts`

```typescript
export async function enrichTask(title: string, description?: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a task management assistant. Analyze tasks and return JSON with category, tags, sentiment, and estimatedDuration."
      },
      {
        role: "user",
        content: `Task: ${title}\nDescription: ${description || "None"}`
      }
    ],
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Error Handling

- **Rate Limits:** Simple retry with exponential backoff (max 2 retries)
- **API Errors:** Graceful degradation - task works without enrichment
- **Timeout:** 10-second timeout, fail silently
- **Client Experience:** Task appears immediately, enrichment updates when ready

---

### 3.5. AI Chat Integration Strategy

**Conversational Task Creation:**

The AI Chat Assistant enables users to create tasks and habits through natural conversation. The AI guides users with questions, understands their goals, and proposes structured plans that users can approve before creation.

**Flow:**
```
User Opens Chat Widget
    ↓
User Types Message (e.g., "I want to start exercising")
    ↓
AI Responds with Questions (e.g., "What type of exercise? How often?")
    ↓
User Provides Details
    ↓
AI Analyzes Conversation & Proposes Plan
    ↓
Plan Displayed to User (tasks + habits preview)
    ↓
User Approves/Rejects Plan
    ↓
If Approved: Tasks & Habits Created in Database
```

**Conversation Flow Diagram:**

```mermaid
sequenceDiagram
    participant User
    participant ChatUI
    participant API
    participant OpenAI
    participant DB

    User->>ChatUI: Opens chat widget
    ChatUI->>API: GET /api/chat/conversations
    API->>DB: Fetch user conversations
    DB-->>API: Return conversations
    API-->>ChatUI: Conversations list

    User->>ChatUI: Types message
    ChatUI->>API: POST /api/chat/message
    API->>OpenAI: Send conversation context
    OpenAI-->>API: AI response
    API->>DB: Save message
    API-->>ChatUI: Return response

    Note over OpenAI,API: AI analyzes conversation<br/>and proposes task/habit plan

    OpenAI->>API: Structured plan (JSON)
    API->>DB: Save plan to conversation.plan
    API-->>ChatUI: Return plan proposal
    ChatUI->>User: Display plan for approval

    User->>ChatUI: Approves plan
    ChatUI->>API: POST /api/chat/approve-plan
    API->>DB: Create tasks/habits from plan
    DB-->>API: Created items
    API-->>ChatUI: Success response
    ChatUI->>User: Show confirmation
```

**AI Chat Service:**

**Location:** `lib/openai.ts`

```typescript
export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId: string
): Promise<{
  response: string;
  planProposal?: PlanProposal;
}> {
  const systemPrompt = `You are a helpful task management assistant. Your goal is to help users create actionable tasks and habits through natural conversation.

Guidelines:
1. Start with guided questions to understand user goals
2. Ask clarifying questions when needed
3. After gathering enough information, propose a structured plan
4. The plan should include:
   - Tasks with titles, descriptions, priorities, due dates (if mentioned)
   - Habits with names, frequencies, and goals
5. Wait for user approval before creating items
6. Be conversational and friendly, not robotic

When proposing a plan, return a JSON structure:
{
  "summary": "Brief summary of the plan",
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "LOW|MEDIUM|HIGH",
      "dueDate": "ISO date string or null"
    }
  ],
  "habits": [
    {
      "name": "Habit name",
      "frequency": "daily|weekly|monthly",
      "goal": "Brief goal description"
    }
  ]
}`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Try to extract plan proposal from response
  const planProposal = extractPlanProposal(content);
  
  return {
    response: content,
    planProposal,
  };
}
```

**Key Features:**
- **Hybrid Conversation:** Starts with guided questions, then allows free-form follow-up
- **Context Awareness:** AI remembers entire conversation history
- **Plan Proposal:** AI generates structured JSON plan with tasks and habits
- **Approval Workflow:** Users review and approve before database creation
- **Conversation History:** All conversations saved for future reference

---

## 4. API Contract

### Zod Schemas (`lib/validations.ts`)

```typescript
import { z } from 'zod';

export const TaskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: TaskPriorityEnum.default('MEDIUM'),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
});

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  category: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  metadata: z.record(z.any()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
```

### API Endpoints

**Task Management:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks (filtered by status) |
| `POST` | `/api/tasks` | Create new task (triggers AI enrichment) |
| `GET` | `/api/tasks/:id` | Get single task |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `POST` | `/api/enrich` | Manually trigger enrichment (optional) |

**AI Chat (NEW):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat/conversations` | List user's conversations |
| `POST` | `/api/chat/conversations` | Create new conversation |
| `GET` | `/api/chat/conversations/:id` | Get conversation with messages |
| `DELETE` | `/api/chat/conversations/:id` | Archive conversation |
| `POST` | `/api/chat/message` | Send message, get AI response |
| `POST` | `/api/chat/approve-plan` | Approve plan and create tasks/habits |

### Chat API Zod Schemas

```typescript
export const ChatMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
});

export const PlanProposalSchema = z.object({
  summary: z.string(),
  tasks: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    priority: TaskPriorityEnum.default('MEDIUM'),
    dueDate: z.string().datetime().nullable().optional(),
  })),
  habits: z.array(z.object({
    name: z.string().min(1).max(100),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    goal: z.string().max(500).optional(),
  })),
});

export const ApprovePlanSchema = z.object({
  conversationId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
});
```

---

## 5. Docker Orchestration

### Simplified Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: taskmanager
      POSTGRES_PASSWORD: taskmanager_dev
      POSTGRES_DB: taskmanager
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskmanager"]
      interval: 5s
      timeout: 5s
      retries: 5

  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://taskmanager:taskmanager_dev@postgres:5432/taskmanager
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      NODE_ENV: development
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run dev

volumes:
  postgres_data:
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]
```

**One-Command Setup:**
```bash
# Set OpenAI API key
echo "OPENAI_API_KEY=sk-..." > .env.local

# Start everything
docker-compose up
```

---

## 6. Implementation Plan (2-Hour Scope)

### Phase 1: Foundation (30 minutes)
- [x] Initialize Next.js 14 with TypeScript
- [x] Set up Tailwind CSS and shadcn/ui
- [x] Configure Prisma with PostgreSQL
- [x] Create Docker Compose setup
- [x] Basic folder structure

### Phase 2: Database & API (30 minutes)
- [x] Define Prisma schema
- [x] Create migrations
- [x] Implement API routes (CRUD)
- [x] Add Zod validation
- [x] Set up Prisma client

### Phase 3: AI Integration (20 minutes)
- [x] Install OpenAI SDK
- [x] Create enrichment service
- [x] Integrate with task creation API
- [x] Add error handling
- [x] Implement async enrichment

### Phase 4: Frontend Core (30 minutes)
- [x] Build TaskCard component
- [x] Build TaskList with filtering
- [x] Create TaskForm (create/edit)
- [x] Implement optimistic updates
- [x] Add loading states

### Phase 5: Polish & Deploy (10 minutes)
- [x] Add animations and transitions
- [x] Ensure responsive design
- [x] Test on mobile/tablet/desktop
- [x] Deploy to Vercel/Railway
- [x] Update README with live link

**Total: ~2 hours**

---

## 6.1. AI Chat Feature Implementation Plan

### Phase 0: Design Plan Documentation (1 hour)
- [x] Update `DESIGN_PLAN.md` with AI Chat feature section
- [x] Add "AI Chat Assistant" to Core Value Proposition
- [x] Update Data Model section with ChatConversation and ChatMessage models
- [x] Add AI Chat Integration Strategy section
- [x] Update API Contract section with chat endpoints
- [x] Update Project Structure section
- [x] Add AI Chat to Implementation Plan
- [ ] Update UI/UX Design Principles
- [ ] Add AI Chat to Security & Performance considerations

### Phase 1: Database & API Foundation (2-3 hours)
- [ ] Add ChatConversation and ChatMessage models to Prisma schema
- [ ] Create and run migration
- [ ] Implement API routes for conversations and messages
- [ ] Add Zod validation schemas
- [ ] Test API endpoints

### Phase 2: OpenAI Chat Integration (2-3 hours)
- [ ] Implement `chatWithAI` function in `lib/openai.ts`
- [ ] Add plan proposal extraction logic
- [ ] Integrate with message API route
- [ ] Handle streaming responses (optional enhancement)
- [ ] Error handling and retries

### Phase 3: Chat UI Components (3-4 hours)
- [ ] Create ChatWidget component (floating, toggleable)
- [ ] Create ChatMessage component (bubbles, markdown)
- [ ] Create PlanProposal component (preview cards, approve/reject)
- [ ] Add typing indicators
- [ ] Implement conversation list view
- [ ] Mobile responsive design

### Phase 4: Plan Approval & Creation (2 hours)
- [ ] Implement approve-plan API route
- [ ] Create tasks/habits from approved plan
- [ ] Handle workspace assignment
- [ ] Show success feedback
- [ ] Update conversation status

### Phase 5: Polish & Integration (2 hours)
- [ ] Add chat widget to main layout
- [ ] Smooth animations and transitions
- [ ] Loading states and error handling
- [ ] Accessibility (keyboard navigation, ARIA labels)
- [ ] Test full flow end-to-end

**Total Estimated Time: 12-15 hours** (including design plan update)

---

## 7. UI/UX Design Principles

### Visual Design
- **Color Scheme:** Modern, accessible palette (slate/gray base with accent colors)
- **Typography:** Inter or system font stack
- **Spacing:** Consistent 4px/8px grid
- **Shadows:** Subtle elevation for cards
- **Animations:** Smooth transitions (200-300ms)

### Component Design
- **Task Cards:** 
  - Hover effects
  - Status badges with colors
  - Priority indicators
  - AI enrichment badges
- **Forms:**
  - Inline validation
  - Clear error messages
  - Loading states
- **Empty States:**
  - Helpful illustrations
  - Clear CTAs
- **AI Chat Widget (NEW):**
  - Fixed position: bottom-right (24px from edges)
  - Size: 380px width × 600px height (max)
  - Mobile: Full screen overlay
  - Smooth slide-up animation
  - Rounded corners, shadow elevation
  - Header with title and minimize button
  - Scrollable message area
  - Input at bottom with send button
  - Typing indicator when AI is responding
- **Chat Message Bubbles:**
  - User: Right-aligned, primary color background
  - Assistant: Left-aligned, gray background
  - Timestamps (relative: "2m ago")
  - Markdown support for formatting
  - Plan proposal cards embedded in messages
- **Plan Proposal UI:**
  - Card-based layout
  - Task preview cards (title, priority, due date)
  - Habit preview cards (name, frequency)
  - "Approve All" button
  - "Edit & Approve" option
  - "Reject" to continue conversation

### Responsive Breakpoints
- **Mobile:** < 640px (single column, stacked)
- **Tablet:** 640px - 1024px (2 columns)
- **Desktop:** > 1024px (3 columns, sidebar)

### Accessibility
- Keyboard navigation
- ARIA labels
- Focus indicators
- Color contrast (WCAG AA)

---

## 8. Performance Optimizations

### Frontend
- **Optimistic Updates:** UI updates immediately, syncs with server
- **Code Splitting:** Dynamic imports for modals
- **Image Optimization:** Next.js Image component
- **Memoization:** React.memo for TaskCard
- **Virtual Scrolling:** For large task lists (optional)
- **Chat Widget (NEW):**
  - Optimistic message display (show user message immediately)
  - Debounced input for typing indicators
  - Lazy load conversation history
  - Cache recent conversations
  - Efficient message pagination

### Backend
- **Database Indexes:** On status, priority, createdAt, userId, conversationId
- **Connection Pooling:** Prisma handles automatically
- **API Caching:** Next.js revalidation
- **Error Boundaries:** Graceful error handling
- **Chat API (NEW):**
  - Rate limiting on chat endpoints (prevent abuse)
  - Message pagination for large conversations
  - Efficient conversation queries with proper indexes
  - OpenAI API retry logic with exponential backoff

### Security Considerations

**General:**
- Authentication required for all protected routes
- User can only access their own data
- Input validation with Zod schemas
- SQL injection prevention (Prisma ORM)

**AI Chat (NEW):**
- Authentication required for all chat endpoints
- User can only access their own conversations
- Rate limiting on chat API (prevent abuse)
- Input sanitization for user messages
- Plan validation before database creation
- OpenAI API key never exposed to client
- Conversation data encrypted at rest (database)

---

## 9. Deployment Strategy

### Local Development
```bash
docker-compose up
# Access at http://localhost:3000
```

### Production Deployment

**Option 1: Vercel (Recommended)**
- Automatic deployments from GitHub
- Environment variables in Vercel dashboard
- PostgreSQL via Vercel Postgres or external provider

**Option 2: Railway**
- One-click deploy from GitHub
- Built-in PostgreSQL
- Simple environment variable setup

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NODE_ENV=production
```

---

## 10. Submission Requirements Alignment

### S1. Application Description
**What it does:**
An AI-powered task manager that automatically enriches tasks with categories, tags, and metadata using OpenAI GPT-4o. Features a beautiful, responsive UI with smooth animations and intuitive interactions.

**Why it's impressive:**
- Real AI integration that adds value (not just a demo)
- Polished UI that feels professional
- Zero-configuration Docker setup
- Reliable, error-free operation
- Fast, responsive performance

### S2. Prompt Documentation
Will document key prompts used:
- Initial project setup
- Component generation
- AI integration
- UI polish iterations
- Deployment configuration

### S3. Live Application Link
Will provide: `https://ai-task-manager.vercel.app` (or similar)

### S4. GitHub Repository Link
Will provide: `https://github.com/[username]/ai-task-manager`

---

## 11. Success Metrics

### Assessment Criteria Alignment

**D1 - UI/UX Refinement:**
- ✅ Modern, polished design
- ✅ Smooth animations
- ✅ Intuitive interactions
- ✅ Thoughtful empty states
- ✅ Accessible components

**D2 - Functional Complexity:**
- ✅ AI-powered enrichment
- ✅ Real-time updates
- ✅ Status management
- ✅ Priority system
- ✅ Category/tag organization

**D3 - Front-End Quality:**
- ✅ Zero visual bugs
- ✅ Proper layout on all screens
- ✅ Smooth interactions
- ✅ Loading states
- ✅ Error handling

**D4 - Back-End Quality:**
- ✅ Reliable API endpoints
- ✅ Data validation
- ✅ Error handling
- ✅ Database integrity
- ✅ AI integration robustness

**D5 - Responsiveness:**
- ✅ Mobile-first design
- ✅ Tablet optimization
- ✅ Desktop enhancement
- ✅ Touch-friendly
- ✅ Responsive typography

**D6 - Performance:**
- ✅ Fast initial load
- ✅ Smooth animations
- ✅ Optimistic updates
- ✅ Efficient rendering
- ✅ Quick API responses

**D7 - Overall Impressiveness:**
- ✅ AI integration adds real value
- ✅ Beautiful, memorable UI
- ✅ One-command setup
- ✅ Production-ready deployment
- ✅ Clear demonstration of skills

---

## 12. Quick Start Guide

### Local Development

```bash
# 1. Clone repository
git clone [repo-url]
cd ai-task-manager

# 2. Set up environment
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local

# 3. Start with Docker
docker-compose up

# 4. Run migrations (in another terminal)
docker-compose exec web npx prisma migrate dev

# 5. Access application
# Open http://localhost:3000
```

### Production Deployment

```bash
# Deploy to Vercel
vercel

# Or deploy to Railway
railway up
```

---

## Approval Checklist

Before proceeding with implementation:

- [x] Scope appropriate for 2-hour assessment
- [x] Tech stack meets requirements (Node.js backend, React frontend)
- [x] AI integration strategy defined
- [x] Docker setup for easy deployment
- [x] Focus on polish over complexity
- [x] All 7 evaluation dimensions addressed
- [x] Submission requirements covered

**Next Steps:** 
1. Execute implementation following the 2-hour plan
2. Document prompts used (S2 requirement)
3. Deploy to production (S3 requirement)
4. Prepare GitHub repository (S4 requirement)
5. Write application description (S1 requirement)

---

## Key Design Decisions

### Why This Approach?

1. **Simplified Architecture:** No monorepo, no worker processes - focus on core features
2. **Direct AI Integration:** Simpler than queue system, still impressive
3. **Next.js API Routes:** Built-in Node.js backend, no separate server
4. **Prisma + PostgreSQL:** Reliable, type-safe, easy to set up
5. **Docker Compose:** One-command setup demonstrates DevOps awareness
6. **shadcn/ui:** Beautiful components out of the box, saves time
7. **Optimistic Updates:** Better UX, demonstrates React expertise

### Trade-offs Made

- **No Authentication:** Single-user demo (saves time, still impressive)
- **No Queue System:** Direct API calls (simpler, still works well)
- **Simple Schema:** Focus on core features (polish over complexity)
- **No Real-time:** Polling/optimistic updates (good enough for demo)

These trade-offs allow maximum polish within the 2-hour constraint while still demonstrating sophisticated skills.
