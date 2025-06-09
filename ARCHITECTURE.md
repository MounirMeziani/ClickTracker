# System Architecture Documentation

## 🏗️ Application Architecture

### System Overview
This is a full-stack basketball-themed productivity application with the following key architectural principles:

1. **Goal-Centric Design**: Goals work like "swappable CDs" - only one active at a time
2. **Dual Click Tracking**: Separate tracking for overall stats and goal-specific progress
3. **Basketball Gamification**: Level progression, uniform unlocks, achievements
4. **Team Collaboration**: Invite-based team system with progress sharing
5. **Type Safety**: Shared TypeScript types across frontend and backend

## 🗂️ Code Organization

### Frontend Architecture (`/client/src/`)

```
├── components/ui/     # shadcn/ui component library
├── hooks/             # Custom React hooks (useAuth, useToast)
├── lib/              
│   ├── queryClient.ts # TanStack Query configuration & API abstraction
│   └── utils.ts      # Utility functions (className merging, etc.)
├── pages/            # Route components (one per major feature)
│   ├── home.tsx      # Main productivity interface
│   ├── goals.tsx     # Goal management
│   ├── teams.tsx     # Team collaboration
│   ├── social.tsx    # Leaderboards & social features
│   ├── onboarding.tsx # First-time user setup
│   └── join-team.tsx # Team invitation acceptance
└── App.tsx           # Main app with routing and providers
```

**Key Frontend Patterns:**
- **React Query**: All API calls use TanStack Query for caching and state management
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Form Validation**: Zod schemas with react-hook-form for type-safe forms
- **Responsive Design**: Mobile-first with Tailwind CSS breakpoints

### Backend Architecture (`/server/`)

```
├── db.ts              # Database connection (Neon PostgreSQL)
├── storage.ts         # Data access layer implementing IStorage interface
├── routes.ts          # Main API endpoints
├── routes-goals.ts    # Goal-specific API endpoints
├── gameLogic.ts       # Basketball theming & level calculations
├── goalSystem.ts      # Goal progression & level decay logic
├── socialSystem.ts    # Team features & motivational content
└── vite.ts           # Development server integration
```

**Key Backend Patterns:**
- **Interface Abstraction**: IStorage interface abstracts database operations
- **Route Separation**: Feature-specific routes in separate files
- **Business Logic Modules**: Game mechanics separated from API routes
- **Type Validation**: Zod schemas validate all request/response data

### Shared Types (`/shared/`)

```
└── schema.ts         # Database schema + TypeScript types + Zod validation
```

**Benefits:**
- Single source of truth for data structures
- Compile-time type checking across frontend/backend
- Runtime validation with Zod
- Database schema definition with Drizzle ORM

## 🔄 Data Flow Architecture

### 1. Goal System Data Flow

```
User Action (Frontend) 
  → API Request with validation 
  → Business logic processing 
  → Database operation via storage layer
  → Response with updated state
  → UI update via React Query cache
```

**Example: Goal Creation**
1. User submits goal form → `pages/onboarding.tsx`
2. Form validation with Zod → `shared/schema.ts` 
3. POST to `/api/goals` → `server/routes-goals.ts`
4. Business logic validation → Goal category assignment
5. Database insert → `storage.createGoal()`
6. Cache invalidation → React Query updates UI

### 2. Click Tracking Data Flow

**Dual Tracking System:**
- **Global Clicks**: Overall productivity metrics (`clickRecords` table)
- **Goal Clicks**: Per-goal progression tracking (`goalClickRecords` table)

```
Click Button Press
  ├── Global Increment → /api/clicks/increment → clickRecords table
  └── Goal Increment → /api/goals/:id/click → goalClickRecords table
```

Both operations happen simultaneously with optimistic updates.

### 3. Team Collaboration Data Flow

```
Team Creation → Invite Generation → Link Sharing → Invite Acceptance → Team Membership

Database Relations:
teams (1) → (many) teamInvites
teams (1) → (many) teamMembers → (1) users
```

## 🗄️ Database Design

### Core Entity Relationships

```sql
-- Core User Data
users (1) → (many) goals
users (1) → (1) playerProfile

-- Click Tracking (Dual System)
users (1) → (many) clickRecords (global daily stats)
goals (1) → (many) goalClickRecords (per-goal daily stats)

-- Team Collaboration
teams (1) → (many) teamMembers → (1) users
teams (1) → (many) teamInvites

-- Gamification
users (1) → (1) playerProfile (levels, achievements)
users (1) → (many) dailyChallenges
```

### Critical Design Decisions

1. **Separate Click Tables**: `clickRecords` vs `goalClickRecords`
   - Allows independent tracking of overall vs goal-specific progress
   - Enables accurate statistics even when switching between goals

2. **Goal Active Flag**: Only one goal can be `isActive` per user
   - Enforces "swappable CD" concept
   - Simplifies UI state management

3. **Team Invite System**: Time-limited invites with unique codes
   - Secure sharing without exposing internal IDs
   - Automatic expiry prevents stale invitations

## 🎮 Game Mechanics Architecture

### Level Progression System

```typescript
// server/gameLogic.ts
CAREER_LEVELS = {
  1: { name: "Rookie", clicksRequired: 25 },
  2: { name: "Bench Player", clicksRequired: 50 },
  // ... progressive difficulty scaling
  12: { name: "Hall of Famer", clicksRequired: 2000 }
}

calculateLevel(totalClicks) → currentLevel + progressToNext
```

### Achievement System

```typescript
// Achievements trigger on specific milestones
checkAchievements(profile, newData) → newAchievements[]

Categories:
- Activity: firstClick, streak3, streak7, streak30
- Progress: levelUp, goalMaster  
- Social: teamPlayer, motivator
- Milestones: centurion, marathon
```

### Daily Challenge Generation

```typescript
// Adaptive difficulty based on user level
generateDailyChallenge(date, userLevel) → {
  type: "click_target" | "streak_maintain" | "goal_focus",
  targetValue: scaledToUserLevel,
  reward: "XP boost" | "achievement progress"
}
```

## 🔧 API Design Patterns

### RESTful Endpoint Structure

```
/api/clicks/*      # Global activity tracking
/api/goals/*       # Goal management (CRUD + actions)
/api/teams/*       # Team collaboration
/api/invites/*     # Invitation system
/api/player/*      # Gamification data
/api/challenge/*   # Daily challenges
```

### Request/Response Patterns

**Standard Response Format:**
```typescript
// Success Response
{ success: true, data: T, message?: string }

// Error Response  
{ success: false, error: string, details?: any }
```

**Validation Pattern:**
```typescript
// Every endpoint validates input with Zod
const requestSchema = z.object({ ... });
const validatedData = requestSchema.parse(req.body);
```

### State Management Patterns

**React Query Configuration:**
```typescript
// Automatic background refetching
// Optimistic updates for mutations
// Cache invalidation strategies
// Error handling with toast notifications
```

## 🚀 Performance Optimizations

### Frontend Optimizations

1. **Query Caching**: TanStack Query caches API responses
2. **Optimistic Updates**: Immediate UI feedback before server confirmation
3. **Code Splitting**: Lazy-loaded route components
4. **Memoization**: React.memo for expensive components

### Backend Optimizations

1. **Database Indexes**: Efficient queries on frequently accessed columns
2. **Connection Pooling**: Neon PostgreSQL connection management
3. **Query Optimization**: Minimal N+1 queries with proper joins
4. **Response Compression**: Gzip compression for API responses

### Database Schema Optimizations

```sql
-- Indexes for common queries
CREATE INDEX idx_goals_player_active ON goals(player_id, is_active);
CREATE INDEX idx_click_records_date ON click_records(date);
CREATE INDEX idx_team_invites_code ON team_invites(invite_code);
```

## 🔐 Security Considerations

### Current Security Model

**Note: Currently using simplified authentication with hardcoded userId = 1**

### Data Validation
- Zod schemas validate all user input
- SQL injection prevention via Drizzle ORM parameterized queries
- XSS prevention through React's built-in escaping

### Team Security
- Invite codes are randomly generated and time-limited
- Team ownership verification before destructive operations
- Cascading deletes prevent orphaned data

## 🧪 Testing Strategy

### Recommended Testing Approach

1. **Unit Tests**: Business logic functions (gameLogic, goalSystem)
2. **Integration Tests**: API endpoints with test database
3. **E2E Tests**: Critical user flows (goal creation, team joining)
4. **Type Tests**: Validate shared schema consistency

### Key Test Scenarios
- Goal switching preserves independent progress
- Team invite flow with expiry handling
- Level progression calculations
- Dual click tracking accuracy

## 🔄 State Management Flow

### Frontend State Architecture

```typescript
// Global State (React Query)
├── API Cache (server state)
│   ├── /api/goals → User's goals list
│   ├── /api/goals/active → Currently active goal
│   ├── /api/clicks/* → Activity statistics
│   └── /api/teams/* → Team data
├── Local UI State (React useState)
│   ├── Form inputs and validation
│   ├── Modal/dialog visibility
│   └── Loading/error states
└── URL State (Wouter routing)
    └── Current page/parameters
```

### Cache Invalidation Strategy

```typescript
// After mutations, invalidate related queries
queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
queryClient.invalidateQueries({ queryKey: ['/api/clicks/today'] });

// Optimistic updates for immediate feedback
queryClient.setQueryData(['/api/goals/active'], optimisticGoal);
```

## 📝 Development Guidelines

### Adding New Features

1. **Define Data Model**: Update `shared/schema.ts` with new tables/types
2. **Storage Layer**: Add methods to `IStorage` interface and `DatabaseStorage`
3. **API Routes**: Create endpoints with proper validation
4. **Frontend Components**: Build UI with React Query integration
5. **Business Logic**: Extract complex logic into separate modules

### Code Quality Standards

- **Type Safety**: All functions must have proper TypeScript types
- **Error Handling**: Comprehensive try/catch with user-friendly messages
- **Validation**: Zod schemas for all data input/output
- **Documentation**: JSDoc comments for complex functions
- **Consistency**: Follow established patterns for similar features

### Database Migration Strategy

```bash
# Schema changes
npm run db:push  # Development: Push schema directly

# Production considerations
# - Use proper migration files
# - Backup before schema changes
# - Test migrations on staging data
```

This architecture document provides the foundation for understanding and extending the basketball productivity application. Each component is designed to be modular, type-safe, and maintainable for future development.