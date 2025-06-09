# Basketball Productivity App

A gamified productivity tracking application with basketball theming, team collaboration, and goal management.

## 🏀 Overview

This is a full-stack TypeScript application that gamifies productivity tracking through basketball-themed elements. Users can create custom goals, track daily activity, level up their "player profile," unlock uniforms (skins), earn achievements, and collaborate with teams.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: Wouter (lightweight)

### Key Dependencies
```json
{
  "frontend": [
    "react", "typescript", "vite",
    "@tanstack/react-query", "wouter",
    "@radix-ui/*", "tailwindcss", "lucide-react"
  ],
  "backend": [
    "express", "drizzle-orm", "@neondatabase/serverless",
    "zod", "tsx"
  ]
}
```

## 🎯 Core Features

### 1. Goal System (Core Feature)
- **"Swappable CDs" Concept**: Only one goal can be active at a time
- Users can create multiple custom goals with names/descriptions
- Each goal has independent click tracking and level progression
- Goals can be edited, deleted, and swapped between
- Categories: productivity, learning, communication, organization, etc.

### 2. Click Tracking
- **Dual Tracking System**:
  - Global clicks (overall statistics)
  - Goal-specific clicks (per-goal progression)
- Daily/Weekly/Monthly/All-time analytics
- Activity heatmap and streak tracking
- +/- increment controls for precise tracking

### 3. Gamification System
- **Basketball-themed progression**:
  - Rookie → Starter → All-Star → Superstar → Hall of Fame
  - 12 levels with increasing click requirements
- **Uniform unlocks** (skins): Different team colors/styles
- **Achievement system**: First click, streaks, milestones
- **Daily challenges**: Dynamic goals based on user level

### 4. Team Collaboration
- Create teams with invite codes
- Share progress and motivate teammates
- Team-specific activity feeds and leaderboards
- Role-based permissions (owner, member)
- Team deletion with cascading data cleanup

### 5. Social Features
- Global and team leaderboards
- Activity insights and motivational messages
- GitHub-style contribution heatmaps
- Team progress tracking and comparison

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (queryClient, utils)
│   │   ├── pages/          # Route components
│   │   └── App.tsx         # Main app with routing
├── server/                 # Express backend
│   ├── db.ts              # Database connection
│   ├── storage.ts         # Data access layer
│   ├── routes.ts          # Main API routes
│   ├── routes-goals.ts    # Goal-specific routes
│   ├── gameLogic.ts       # Basketball theming & levels
│   ├── goalSystem.ts      # Goal progression logic
│   └── socialSystem.ts    # Team features & motivation
├── shared/
│   └── schema.ts          # Database schema & types
└── package.json           # Dependencies & scripts
```

## 🗄️ Database Schema

### Core Tables
- **users**: Basic authentication and user data
- **clickRecords**: Daily overall click tracking
- **playerProfile**: Gamification data (level, skins, achievements)
- **goals**: User-created productivity goals
- **goalClickRecords**: Per-goal daily click tracking
- **teams**: Team collaboration data
- **teamMembers**: Team membership relationships
- **teamInvites**: Invitation system with expiry
- **dailyChallenges**: Generated daily objectives

### Key Relationships
- One user can have many goals (only one active)
- Each goal has independent click records
- Teams have many members with roles
- Invites link teams to potential members

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables:
  - `DATABASE_URL`: PostgreSQL connection string

### Installation
```bash
# Install dependencies
npm install

# Set up database (creates tables)
npm run db:push

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev`: Start development server (frontend + backend)
- `npm run build`: Build for production
- `npm run db:push`: Push schema changes to database
- `npm run db:studio`: Open Drizzle Studio for database inspection

## 🎮 Game Mechanics

### Level Progression
```typescript
CAREER_LEVELS = {
  1: { name: "Rookie", clicksRequired: 25 },
  2: { name: "Bench Player", clicksRequired: 50 },
  3: { name: "Starter", clicksRequired: 100 },
  // ... up to level 12: "Hall of Famer"
}
```

### Achievement System
- **firstClick**: Complete your first activity
- **streak3/7/30**: Maintain daily activity streaks
- **levelUp**: Reach new career levels
- **teamPlayer**: Join your first team
- **marathon**: Complete 1000+ activities in a day

### Daily Challenges
Dynamically generated based on user level:
- Beginner: 10-20 clicks
- Intermediate: 30-50 clicks  
- Advanced: 75-100+ clicks

## 🚀 Key Features Implementation

### Goal Management
- Users start with onboarding flow if no goals exist
- Suggested goals with predefined categories
- Custom goal creation with validation
- Goal switching preserves independent progress
- Detailed analytics per goal

### Team Collaboration
- Invite system with shareable links
- Real-time team activity feeds
- Progress comparison and motivation
- Team deletion with proper cleanup

### Data Architecture
- Separate tracking for overall vs goal-specific clicks
- Efficient caching with TanStack Query
- Type-safe API with Zod validation
- Optimistic updates for smooth UX

## 🎨 UI/UX Design

### Design System
- **Primary Colors**: Basketball orange/blue theme
- **Typography**: Clean, modern sans-serif
- **Layout**: Responsive grid with card-based design
- **Icons**: Lucide React for consistency
- **Animations**: Subtle transitions and hover effects

### Responsive Design
- Mobile-first approach
- Collapsible navigation
- Touch-friendly controls
- Adaptive layouts for all screen sizes

## 🔍 Code Quality

### Type Safety
- Full TypeScript coverage
- Shared types between frontend/backend
- Zod runtime validation
- Drizzle ORM type inference

### Error Handling
- Try/catch blocks in all async operations
- User-friendly error messages
- Toast notifications for feedback
- Graceful fallbacks for loading states

### Performance
- React Query caching and background updates
- Optimistic mutations for immediate feedback
- Efficient database queries with indexes
- Code splitting and lazy loading

## 🚦 API Endpoints

### Click Tracking
- `GET /api/clicks/today` - Today's activity
- `GET /api/clicks/weekly` - Week statistics
- `POST /api/clicks/increment` - Add activity
- `POST /api/clicks/decrement` - Remove activity

### Goals Management
- `GET /api/goals` - User's goals list
- `GET /api/goals/active` - Currently active goal
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/click` - Goal-specific increment

### Team Features
- `GET /api/teams/user/:id` - User's teams
- `POST /api/teams` - Create team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/invites` - Create invite
- `GET /api/invites/:code` - Validate invite
- `POST /api/invites/:code/accept` - Join team

### Player Profile
- `GET /api/player/profile` - Gamification data
- `PUT /api/player/profile` - Update profile
- `GET /api/challenge/daily` - Today's challenge

## 🎯 Future Enhancements

### Planned Features
- [ ] Real user authentication (currently hardcoded)
- [ ] Email notifications for team invites
- [ ] Advanced analytics and insights
- [ ] Mobile app with push notifications
- [ ] Integration with external productivity tools
- [ ] Custom achievement creation
- [ ] Tournament/competition features

### Technical Debt
- [ ] Implement proper user authentication
- [ ] Add comprehensive error logging
- [ ] Optimize database queries for scale
- [ ] Add automated testing suite
- [ ] Implement data export/backup features

## 📚 Learning Resources

### Understanding the Codebase
1. Start with `/shared/schema.ts` for data models
2. Review `/server/storage.ts` for data operations
3. Examine `/client/src/pages/home.tsx` for main UI
4. Check `/server/routes.ts` for API structure

### Key Concepts
- **Goal System**: Independent tracking per goal
- **Dual Click Tracking**: Global + goal-specific
- **Team Collaboration**: Invite-based membership
- **Gamification**: Basketball-themed progression
- **Type Safety**: Shared types across stack

This documentation provides a comprehensive overview for developers working on or extending the basketball productivity app.