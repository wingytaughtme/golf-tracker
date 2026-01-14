# Golf Tracker

Golf score tracking PWA with USGA handicap calculation.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- PostgreSQL via Prisma ORM (Supabase hosted)
- NextAuth.js (JWT sessions)
- Zustand for client state
- Tailwind CSS

## Commands
```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run db:seed      # Seed dev database (25 courses + demo data)
npm run db:reset     # Reset and reseed database
npm run db:push      # Push schema changes (prototyping)
```

## Project Structure
```
golf-tracker/
├── app/
│   ├── (auth)/                      # Public auth pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/                 # Protected routes (require auth)
│   │   ├── courses/
│   │   │   ├── [id]/edit/
│   │   │   ├── favorites/
│   │   │   └── new/
│   │   ├── dashboard/
│   │   ├── players/[id]/
│   │   ├── rounds/
│   │   │   ├── [id]/summary/
│   │   │   └── new/
│   │   └── settings/
│   ├── api/                         # REST API
│   │   ├── auth/, courses/, players/, rounds/, user/
│   └── fonts/
├── components/                      # React components by feature
│   ├── courses/, dashboard/, layout/, players/
│   ├── providers/, rounds/, scorecard/, ui/
├── lib/
│   ├── calculations/                # handicap.ts, statistics.ts
│   └── hooks/                       # Custom React hooks
├── prisma/                          # Schema and seed data
├── scripts/                         # Utility scripts
├── stores/                          # Zustand stores
└── types/                           # TypeScript declarations
```

## Coding Conventions

### Components
- Server Components by default for pages (fetch with Prisma directly)
- Client Components marked with `'use client'` for interactivity
- File naming: kebab-case (`score-cell.tsx`)
- Component naming: PascalCase (`ScoreCell`)

### API Routes
- Always check `getServerSession()` first
- Return 401 for unauthorized, 400 for bad request, 404 for not found
- Use `prisma.$transaction()` for multi-record creates

### Types
- Define interfaces at top of file
- Export types from stores for hooks to use

### Database
- UUID primary keys throughout
- Nine-based course model (front/back/named nines)
- Cascading deletes for related records

## State Management
- Zustand stores in `/stores` (scorecard-store, offline-store)
- Server Components for initial data loading
- localStorage backup for offline support

## Authentication
- Demo account: `demo@example.com` / `demo1234`
- JWT sessions (30-day expiry)
- Protected routes in `app/(dashboard)/` check session in layout

## Environment Variables
```
DATABASE_URL       # Pooled Supabase connection (for queries)
DIRECT_URL         # Direct connection (for migrations)
NEXTAUTH_SECRET    # JWT signing key
NEXTAUTH_URL       # Base URL (http://localhost:3000 for dev)
```

## Business Logic
- USGA handicap calculation in `lib/calculations/handicap.ts`
- Uses best 8 of last 20 rounds
- Equitable Stroke Control (ESC) applied
- Statistics calculated in `lib/calculations/statistics.ts`

## Testing
- Manual testing via `docs/TESTING_CHECKLIST.md`
- No automated test suite

## Don'ts
- Skip auth checks in API routes
- Commit `.env.local` (contains credentials)
- Push to main without running testing checklist

## Maintaining This File
Update CLAUDE.md when committing changes that affect:
- **Commands**: New npm scripts or changed usage
- **Project structure**: New directories or reorganization
- **Conventions**: New patterns or changed coding standards
- **Dependencies**: New major libraries or tools
- **Environment**: New env variables required
- **Business logic**: New calculations or changed algorithms

Skip updates for routine commits (bug fixes, minor features) that don't change the above.
