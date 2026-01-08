# Golf Tracker - Claude Code Implementation Guide

## Quick Start

This guide contains the exact prompts to feed Claude Code for each phase. Each phase should be fully verified before proceeding to the next.

---

## Pre-Implementation Setup

Before starting, ensure you have:
1. Node.js 18+ installed
2. A Supabase account (free tier works) - create a project and get your database URL
3. Claude Code installed and authenticated

---

## Phase 1: Foundation

### Prompt 1.1 - Project Initialization

```
Create a new Next.js 14 project for a golf score tracking application.

Requirements:
- Use TypeScript with strict mode
- Use the App Router (not pages router)
- Install and configure Tailwind CSS
- Install these additional dependencies: prisma, @prisma/client, next-auth, zustand, recharts
- Create a clean file structure with these top-level folders: app, components, lib, stores, types, prisma

Initialize the project in the current directory. After setup, show me the package.json and folder structure.
```

### Prompt 1.2 - Database Schema

```
Now set up Prisma with the complete database schema for the golf tracker.

Create prisma/schema.prisma with these models:
- User (id, email, password_hash, name, avatar_url, created_at)
- Player (id, user_id nullable FK, name, email, ghin_number, home_course_id FK, created_at)
- Course (id, name, city, state, zip_code, address, phone, website, num_holes default 18, course_type, latitude, longitude, created_at, updated_at)
- TeeSet (id, course_id FK, name, color, course_rating decimal, slope_rating int, total_yardage int, gender)
- Hole (id, tee_set_id FK, hole_number 1-18, par 3-6, distance int yards, handicap_index 1-18)
- Round (id, course_id FK, tee_set_id FK, created_by FK user, date_played, status enum in_progress/completed/abandoned, round_type enum casual/tournament/practice, weather, temperature, notes, started_at, completed_at, created_at, updated_at)
- RoundPlayer (id, round_id FK, player_id FK, playing_handicap decimal, gross_score int, net_score decimal, position 1-4)
- Score (id, round_player_id FK, hole_id FK, strokes int nullable, putts int nullable, fairway_hit bool nullable, green_in_regulation bool nullable, penalties int default 0, sand_shots int default 0, notes)
- HandicapHistory (id, player_id FK, handicap_index decimal, effective_date, calculation_details json)
- FavoriteCourse (id, user_id FK, course_id FK, created_at)

Use UUID for all IDs. Add appropriate indexes on foreign keys. Add unique constraints where needed (email, hole_number per tee_set, etc).

After creating the schema, generate the Prisma client.
```

### Prompt 1.3 - Authentication Setup

```
Set up NextAuth.js with credentials-based authentication.

Create:
1. lib/prisma.ts - Prisma client singleton
2. lib/auth.ts - NextAuth configuration with:
   - CredentialsProvider for email/password login
   - Password hashing with bcrypt
   - JWT strategy
   - Session callback to include user id
3. app/api/auth/[...nextauth]/route.ts
4. types/next-auth.d.ts - Extend session types to include user id
5. A registration API at app/api/auth/register/route.ts

Use bcrypt for password hashing. Include proper error handling.
```

### Prompt 1.4 - Layout Components

```
Create the basic layout components for the dashboard.

Create:
1. components/layout/header.tsx - Top navigation bar with:
   - App logo/name "GolfTracker"
   - Navigation links: Dashboard, Courses, My Rounds, Players
   - User menu (avatar, dropdown with settings/logout)
   
2. components/layout/nav.tsx - Mobile-friendly bottom navigation

3. components/layout/footer.tsx - Simple footer

4. app/(dashboard)/layout.tsx - Dashboard layout wrapping all authenticated pages, includes header and handles auth redirect if not logged in

5. app/(auth)/layout.tsx - Clean layout for login/register pages

Use Tailwind with this color scheme:
- Primary: #1B4D3E (forest green)
- Secondary: #2D5A27 (fairway green)  
- Accent: #C5A572 (sand/gold)
- Background: #F5F5F0 (off-white)
- Text: #1A1A1A

Make it mobile-responsive.
```

### Prompt 1.5 - Auth Pages & Landing

```
Create the authentication pages and landing page.

1. app/page.tsx - Landing page with:
   - Hero section explaining the app
   - Features list (track scores, calculate handicap, view stats)
   - CTA buttons for Sign Up and Log In
   - Nice golf-themed imagery/icons

2. app/(auth)/login/page.tsx - Login form with:
   - Email and password fields
   - Sign in button
   - Link to register
   - Error handling display

3. app/(auth)/register/page.tsx - Registration form with:
   - Name, email, password, confirm password
   - Create account button
   - Link to login
   - Validation

4. app/(dashboard)/page.tsx - Basic dashboard page (placeholder for now) showing:
   - Welcome message with user namenpm 
   - Quick action cards: "Start New Round", "View Courses", "My Stats"
   - Recent rounds section (placeholder)

Include form validation and loading states.
```

### Verification Checklist 1

After Claude Code completes Phase 1, verify:
- [ ] `npm run dev` starts without errors
- [ ] Can navigate to http://localhost:3000
- [ ] Landing page displays correctly
- [ ] Can register a new account
- [ ] Can log in with that account
- [ ] Dashboard page shows after login
- [ ] Logging out works
- [ ] Database tables exist in Supabase

---

## Phase 2: Course Management

### Prompt 2.1 - Course API & Search

```
Build the course management feature starting with the API and search page.

Create:
1. app/api/courses/route.ts - GET endpoint with:
   - Search by name (partial match, case insensitive)
   - Filter by state
   - Filter by course_type
   - Pagination (limit/offset)
   - Include tee set count in response

2. app/(dashboard)/courses/page.tsx - Course search page with:
   - Search input field (debounced)
   - State dropdown filter (all US states)
   - Course type filter (public/private/resort/municipal)
   - Results grid showing course cards
   - Loading state
   - "No results" state

3. components/courses/course-card.tsx - Course preview card showing:
   - Course name
   - City, State
   - Course type badge
   - Number of holes
   - "View Details" button
   - Favorite button (heart icon)

Make the search responsive and handle edge cases.
```

### Prompt 2.2 - Course Detail Page

```
Create the course detail page with full information.

Create:
1. app/api/courses/[id]/route.ts - GET single course with all tee sets and their holes

2. app/(dashboard)/courses/[id]/page.tsx - Course detail page with:
   - Course header (name, location, contact info, website link)
   - Favorite toggle button
   - Tee set selector tabs/dropdown
   - Hole-by-hole data table for selected tee set
   - "Start Round Here" button

3. components/courses/tee-selector.tsx - Tee set picker showing:
   - Tee name and color (colored indicator dot)
   - Course rating / Slope rating
   - Total yardage
   - Currently selected tee highlighted

4. components/courses/hole-table.tsx - Hole data display:
   - Table format matching a scorecard layout
   - Columns: Hole #, Par, Yards, Handicap
   - Front 9 with OUT totals
   - Back 9 with IN totals
   - Grand totals row
   - Alternating row colors for readability
```

### Prompt 2.3 - Seed Data

```
Create a database seed script with real US golf course data.

Create prisma/seed.ts that seeds 25 courses including:

Famous courses (research accurate data for these):
1. Pebble Beach Golf Links, CA
2. Augusta National Golf Club, GA (private)
3. Pinehurst No. 2, NC
4. TPC Sawgrass, FL
5. Torrey Pines South, CA
6. Bethpage Black, NY
7. Whistling Straits, WI
8. Kiawah Island Ocean Course, SC
9. Bandon Dunes, OR
10. Shadow Creek, NV

Add 15 more popular public courses spread across different states.

For each course include:
- Full address and contact info
- At least 2-3 tee sets (championship, middle, forward)
- All 18 holes with accurate par, yardage, and handicap
- Course and slope ratings for each tee set

The data should be as accurate as possible - research from official course websites or golf databases.

Update package.json with a "seed" script and update Prisma config.
```

### Prompt 2.4 - Favorites Feature

```
Implement the favorite courses feature.

Create:
1. app/api/user/favorites/route.ts - GET user's favorite courses
2. app/api/user/favorites/[courseId]/route.ts - POST to add, DELETE to remove

Update:
3. components/courses/course-card.tsx - Add functioning favorite toggle
4. app/(dashboard)/courses/[id]/page.tsx - Add functioning favorite toggle

5. Create app/(dashboard)/courses/favorites/page.tsx - Page showing only favorited courses

The favorite button should:
- Show filled heart if favorited, outline if not
- Toggle on click
- Show optimistic UI update
- Handle errors gracefully
```

### Verification Checklist 2

- [ ] Course search page loads
- [ ] Can search courses by name
- [ ] Can filter by state and type
- [ ] Course cards display correctly
- [ ] Clicking a course opens detail page
- [ ] Tee selector works and updates hole table
- [ ] Hole table shows all 18 holes with correct data
- [ ] Can favorite/unfavorite courses
- [ ] Favorites page shows only favorited courses
- [ ] Seed data includes diverse courses

---

## Phase 3: Player Management

### Prompt 3.1 - Player API & Profile

```
Build the player management feature.

Create:
1. app/api/players/route.ts:
   - GET: List players belonging to current user (including their own player profile)
   - POST: Create new player (guest)

2. app/api/players/[id]/route.ts:
   - GET: Single player with basic stats
   - PUT: Update player
   - DELETE: Delete player (only guests, not self)

3. app/(dashboard)/players/page.tsx - Player list page:
   - Shows user's own profile card first (highlighted)
   - Lists guest players they've created
   - "Add Player" button
   - Each card shows name and handicap

4. app/(dashboard)/players/[id]/page.tsx - Player profile page:
   - Profile header with name, handicap, rounds played
   - Edit button (opens modal/form)
   - Stats section (placeholder for Phase 6)
   - Recent rounds list (placeholder)

5. components/players/player-card.tsx - Player summary card
```

### Prompt 3.2 - Player Forms

```
Create player creation and editing forms.

Create:
1. components/players/player-form.tsx - Reusable form with:
   - Name (required)
   - Email (optional)
   - GHIN Number (optional)
   - Home course selector (dropdown of courses)
   - Validation
   - Submit handler prop

2. components/players/player-create-modal.tsx - Modal wrapper for creating guest players:
   - Uses player-form
   - Creates via API
   - Closes on success
   - Shows in players list

3. components/players/player-selector.tsx - Multi-select component for choosing players:
   - Shows current user's player first
   - Shows guest players
   - Checkbox selection (max 4)
   - Selected players shown as chips
   - "Add new player" quick action
   - This will be used in round setup

4. Update the players list page to include the create modal trigger
```

### Verification Checklist 3

- [ ] Players page shows logged-in user's profile
- [ ] Can create a guest player
- [ ] Guest player appears in list
- [ ] Can view player detail page
- [ ] Can edit player information
- [ ] Player selector component works (test in isolation if needed)

---

## Phase 4: Round Setup

### Prompt 4.1 - Round Setup Wizard

```
Create the round setup wizard - a multi-step form to start a new round.

Create:
1. app/(dashboard)/rounds/new/page.tsx - The wizard container with:
   - Step indicator (1. Course → 2. Tees → 3. Players → 4. Details)
   - Back/Next navigation
   - State management for wizard data
   
2. components/rounds/round-setup-wizard.tsx - The wizard logic with steps:

   Step 1 - Course Selection:
   - Embedded course search (reuse search component)
   - Recent courses section
   - Favorite courses section
   - Click to select → advance to step 2
   
   Step 2 - Tee Selection:
   - Show selected course name
   - List all tee sets with details
   - Radio selection
   - Select → advance to step 3
   
   Step 3 - Player Selection:
   - Use the player-selector component
   - Must select at least 1 player (self auto-selected)
   - Max 4 players
   - Show playing handicap input for each selected player
   - Continue → advance to step 4
   
   Step 4 - Round Details:
   - Date picker (defaults to today)
   - Round type: Casual / Tournament / Practice
   - Weather: Sunny / Cloudy / Rainy / Windy
   - Temperature input (optional)
   - Notes textarea (optional)
   - "Start Round" button

3. app/api/rounds/route.ts:
   - POST: Create round with round_players and empty scores for all holes
   - Returns round ID for redirect
```

### Prompt 4.2 - Round API Completion

```
Complete the round API endpoints.

Create:
1. app/api/rounds/route.ts - GET: List user's rounds with filters
   - Filter by status (in_progress, completed, all)
   - Filter by date range
   - Include course name, player names, total scores
   - Paginated
   - Sorted by date descending

2. app/api/rounds/active/route.ts - GET: User's in-progress rounds

3. app/api/rounds/[id]/route.ts:
   - GET: Full round details with scores, players, course, holes
   - PUT: Update round details (weather, notes, etc)
   - DELETE: Abandon/delete round

4. Update the dashboard page to show:
   - Alert if there are in-progress rounds
   - Quick resume button for active rounds
   - List of recent completed rounds

When a round is created, pre-create all Score records (18 per player) with null strokes to simplify updates later.
```

### Verification Checklist 4

- [ ] Can navigate to /rounds/new
- [ ] Step 1: Can search and select a course
- [ ] Step 2: Can select a tee set
- [ ] Step 3: Can select players
- [ ] Step 4: Can fill in details
- [ ] "Start Round" creates round and redirects
- [ ] Round appears in API/database
- [ ] All 18 score records pre-created per player
- [ ] Dashboard shows active round alert

---

## Phase 5: Scorecard (Critical)

### Prompt 5.1 - Scorecard Layout

```
Build the core scorecard component - this must look exactly like a real golf scorecard.

Create components/scorecard/scorecard.tsx and related components:

The scorecard should render as a table/grid with this EXACT structure:

HEADER ROW: Course name, Date, Weather, Tee info
HOLE ROW: Labels 1-9, then "OUT", then 10-18, then "IN", then "TOT"
HDCP ROW: Handicap index for each hole
YARDS ROW: Distance for each hole, with subtotals
PAR ROW: Par for each hole, with subtotals (36 for 9 holes typically)
PLAYER ROWS: One row per player with score cells and totals

Visual requirements:
- Use a monospace or tabular font for numbers
- Fixed-width columns for alignment
- Alternating row backgrounds
- Clear visual separation between front 9 and back 9
- The "OUT", "IN", "TOT" columns should be visually distinct
- Horizontal scrolling on mobile (the card is wider than most screens)

Create:
1. components/scorecard/scorecard.tsx - Main wrapper
2. components/scorecard/scorecard-header.tsx - Course/date info
3. components/scorecard/scorecard-grid.tsx - The actual grid
4. components/scorecard/scorecard-row.tsx - Generic row component
5. components/scorecard/score-cell.tsx - Individual score cell (interactive)

For now, just build the static layout. Score cells should display the current value but not be editable yet. Use the hole data and player data from the round.
```

### Prompt 5.2 - Score Entry

```
Make the scorecard interactive with score entry.

Update components/scorecard/score-cell.tsx:

When a score cell is tapped/clicked:
1. Show a score input overlay/popover with:
   - Large number buttons (1-9)
   - +/- buttons for fine adjustment
   - Current score displayed prominently
   - "Clear" button to reset
   - Tap outside to close

2. Apply visual formatting based on score vs par:
   - Eagle or better (-2+): Gold/yellow circle background
   - Birdie (-1): Green circle or green background
   - Par (0): Neutral, no decoration
   - Bogey (+1): Light red/pink with square border
   - Double bogey+ (+2+): Darker red with double border

Create:
1. components/scorecard/score-input.tsx - The input popover
2. stores/scorecard-store.ts - Zustand store for:
   - Current scores state
   - Active hole/player
   - Dirty state (has unsaved changes)
   - Actions: updateScore, clearScore

The score formatting should be clearly visible - this is important for quickly seeing performance at a glance.
```

### Prompt 5.3 - Auto-Save

```
Implement auto-save functionality for the scorecard.

Create/update:

1. app/api/rounds/[id]/scores/route.ts - PUT endpoint:
   - Accept array of score updates: [{scoreId, strokes, putts?, fairway_hit?, gir?}]
   - Batch update all scores in one transaction
   - Return updated scores

2. Update stores/scorecard-store.ts:
   - Add saveScores async action
   - Track saving state
   - Track last saved timestamp

3. Create a custom hook: lib/hooks/use-auto-save.ts
   - Debounced save (2 second delay after last change)
   - Calls the batch update endpoint
   - Handles errors with retry

4. Update scorecard.tsx:
   - Use the auto-save hook
   - Show save status indicator:
     - "Saving..." with spinner when saving
     - "Saved" with checkmark when synced
     - "Offline - will sync" if save fails
     - "Last saved: X min ago" timestamp
   
5. Add local storage backup:
   - Save scores to localStorage on every change
   - On component mount, check for newer localStorage data
   - Restore from localStorage if server data is older
```

### Prompt 5.4 - Round Controls

```
Add round control buttons and the round page.

Create:
1. components/scorecard/scorecard-controls.tsx - Control bar with:
   - "Save & Exit" button - saves and returns to dashboard
   - "Complete Round" button - finalizes the round
   - "Abandon Round" button - with confirmation dialog

2. app/api/rounds/[id]/complete/route.ts - POST endpoint:
   - Validates all scores are entered
   - Calculates gross total for each player
   - Calculates score differential for handicap
   - Updates round status to 'completed'
   - Updates player handicap history
   - Returns summary data

3. app/(dashboard)/rounds/[id]/page.tsx - The main round/scorecard page:
   - Fetches round data
   - Renders scorecard component
   - Handles loading state
   - If round is completed, show read-only scorecard
   - If round is in_progress, show editable scorecard with controls

4. app/(dashboard)/rounds/[id]/summary/page.tsx - Post-round summary:
   - Show final scores for all players
   - Show score vs par
   - Highlight best/worst holes
   - Show handicap differential
   - Links to player profiles
   - "Back to Dashboard" button

5. Update components/scorecard/scorecard.tsx for mobile:
   - Add swipe gesture to switch front 9 / back 9
   - Or toggle buttons for 9-hole view
   - Ensure touch targets are large enough (44px min)
```

### Prompt 5.5 - Scorecard Polish

```
Final polish on the scorecard experience.

Add:
1. Current hole indicator:
   - Highlight the cell/column for the hole currently being played
   - Auto-advance: when all players have a score for hole N, highlight hole N+1

2. Running totals:
   - Show "E" for even, "+3" for over, "-2" for under par
   - Update in real-time as scores are entered
   - Both per-9 totals and overall total

3. Player reordering:
   - Allow drag to reorder players on the scorecard
   - Save player position preference

4. Keyboard support (desktop):
   - Arrow keys to navigate between cells
   - Number keys to enter score
   - Tab to move to next player same hole
   - Enter to move to next hole

5. Visual polish:
   - Smooth transitions on score changes
   - Subtle animations on save
   - Professional scorecard appearance with proper typography
   - Print-friendly styles (optional)

6. Error handling:
   - Show clear error if save fails
   - Retry button
   - Never lose user data
```

### Verification Checklist 5

- [ ] Scorecard page loads for an active round
- [ ] Scorecard displays like a real scorecard
- [ ] Can tap cells to enter scores
- [ ] Score formatting shows correctly (birdie green, bogey red)
- [ ] Running totals calculate correctly
- [ ] Auto-save triggers after changes
- [ ] Save status indicator works
- [ ] Can save and exit mid-round
- [ ] Can resume a saved round (scores persist)
- [ ] Can complete a round
- [ ] Summary page shows after completion
- [ ] Completed round shows read-only scorecard
- [ ] Mobile experience works well

---

## Phase 6: Statistics & Dashboard

### Prompt 6.1 - Handicap Calculation

```
Implement World Handicap System calculations.

Create lib/calculations/handicap.ts with:

1. calculateScoreDifferential(grossScore, courseRating, slopeRating):
   - Formula: (113 / slope) * (gross - rating)
   - Return rounded to 1 decimal

2. applyEquitableStrokeControl(grossScore, courseHandicap, holePars):
   - Apply ESC max per hole based on course handicap:
     - 9 or less: max double bogey
     - 10-19: max 7
     - 20-29: max 8
     - 30-39: max 9
     - 40+: max 10
   - Return adjusted gross score

3. calculateHandicapIndex(differentials[]):
   - If < 3 rounds: return null (not enough data)
   - If 3 rounds: use lowest - 2.0
   - If 4 rounds: use lowest - 1.0
   - If 5 rounds: use lowest
   - If 6 rounds: average of 2 lowest - 1.0
   - If 7-8 rounds: average of 2 lowest
   - If 9-11 rounds: average of 3 lowest
   - If 12-14 rounds: average of 4 lowest
   - If 15-16 rounds: average of 5 lowest
   - If 17-18 rounds: average of 6 lowest
   - If 19 rounds: average of 7 lowest
   - If 20+ rounds: average of 8 lowest of last 20
   - Cap at 54.0 max

4. calculatePlayingHandicap(handicapIndex, slopeRating, courseRating, par):
   - Formula: handicapIndex * (slope / 113) + (rating - par)
   - Round to nearest integer

5. Update the round completion endpoint to:
   - Calculate and store score differential
   - Recalculate player's handicap index
   - Store in handicap_history

Create app/api/players/[id]/handicap/route.ts to get:
   - Current handicap
   - Handicap history
   - Recent differentials
```

### Prompt 6.2 - Statistics Queries

```
Create database queries for player statistics.

Create lib/calculations/statistics.ts with:

1. getPlayerOverallStats(playerId):
   - Total rounds played
   - Average gross score
   - Best round
   - Worst round
   - Current handicap
   - Average score vs par

2. getPlayerScoringStats(playerId):
   - Scoring average on par 3s, 4s, 5s
   - Eagles, birdies, pars, bogeys, double+, others counts
   - Percentage breakdown

3. getPlayerDetailedStats(playerId):
   - Fairways hit % (only holes where tracked, exclude par 3s)
   - Greens in regulation %
   - Average putts per round
   - Scrambling % (up-and-down when missing GIR)
   - These only if the user tracks these metrics

4. getPlayerTrends(playerId, limit = 20):
   - Handicap over last N rounds
   - Scoring average over last N rounds
   - Return data formatted for charts

5. getPlayerCourseStats(playerId, courseId?):
   - If courseId: stats for that specific course
   - If not: breakdown by course
   - Best/worst scores per course
   - Times played per course

Create app/api/players/[id]/stats/route.ts - Returns all the above
```

### Prompt 6.3 - Player Dashboard

```
Build the player dashboard with all statistics.

Update app/(dashboard)/players/[id]/page.tsx:

Layout (match the design from the project plan):

HEADER SECTION:
- Player name large
- Current handicap index prominently displayed  
- Total rounds played
- Member since date
- Edit profile button

QUICK STATS ROW (4 cards):
- Average Score
- Best Round (with course name)
- Fairways Hit % (if tracked)
- GIR % (if tracked)

HANDICAP TREND CHART:
- Line chart showing handicap over last 20 rounds
- X-axis: date
- Y-axis: handicap
- Use Recharts LineChart

SCORING DISTRIBUTION:
- Bar chart or pie chart showing eagles/birdies/pars/bogeys/double+
- Use Recharts

RECENT ROUNDS TABLE:
- Date, Course, Tees, Score, +/-, Differential
- Click row to view round details
- "View All" link to full round history

BOTTOM TABS/SECTIONS:
- Course Breakdown (stats per course played)
- Scoring by Par (par 3/4/5 averages)

Create reusable chart components:
1. components/dashboard/handicap-chart.tsx
2. components/dashboard/scoring-distribution.tsx
3. components/dashboard/stats-card.tsx
4. components/dashboard/recent-rounds.tsx
```

### Prompt 6.4 - Round History

```
Build the round history page.

Create app/(dashboard)/rounds/page.tsx:

Features:
- List all user's rounds (paginated)
- Filter by: status, date range, course
- Sort by: date, score
- Each row shows: date, course, tees, players, score, status
- Click to view round detail

Table columns:
- Date
- Course (with link to course page)
- Tees
- Score / Par (+/-)
- Players (avatars or names)
- Status badge (completed/in-progress)
- Actions (view, delete for incomplete)

Add:
- Search by course name
- "In Progress" filter shows incomplete rounds prominently
- Empty state with CTA to start a round
```

### Verification Checklist 6

- [ ] Handicap calculates correctly after completing a round
- [ ] Handicap appears on player profile
- [ ] Statistics calculate correctly
- [ ] Dashboard displays all stat cards
- [ ] Handicap chart renders
- [ ] Scoring distribution chart renders
- [ ] Recent rounds list works
- [ ] Round history page shows all rounds
- [ ] Can filter round history
- [ ] Stats update after new rounds

---

## Phase 7: Polish & Offline

### Prompt 7.1 - Offline Support

```
Add offline support for the scorecard - critical for on-course use where cell coverage is poor.

Implement:

1. Create a service worker (public/sw.js):
   - Cache static assets
   - Cache the scorecard page shell
   - Network-first for API calls with fallback to cache

2. Update next.config.js for PWA:
   - Add manifest.json for installability
   - Configure service worker registration

3. Enhance lib/hooks/use-auto-save.ts:
   - Detect online/offline status
   - Queue failed saves
   - Sync queue when back online
   - Show sync status to user

4. Update stores/scorecard-store.ts:
   - Always save to localStorage on change
   - Track pending sync queue
   - Sync indicator state

5. Add to scorecard:
   - Offline indicator banner when disconnected
   - "X changes pending sync" message
   - Automatic sync when reconnected
   - Visual confirmation when sync completes

6. Handle edge cases:
   - Round created while online, continued offline
   - Conflicting edits (last-write-wins is fine)
   - Very long offline periods
```

### Prompt 7.2 - Additional Stat Tracking

```
Add optional detailed stat tracking to the scorecard.

Update:

1. components/scorecard/score-input.tsx - Add tabs or expandable section:
   - Main: Strokes (the number input)
   - Details: 
     - Putts input (0-9)
     - Fairway hit checkbox (hidden for par 3s)
     - Green in regulation checkbox

2. Settings to enable/disable detailed tracking:
   - Add user preference in database
   - Add toggle in settings page
   - Default to simple (strokes only)

3. Update the API to handle the additional fields

4. Show detailed stats on scorecard if enabled:
   - Small indicators below score showing putts/FIR/GIR
   - Or separate rows on the scorecard
```

### Prompt 7.3 - Final Polish

```
Final polish and optimizations.

1. Loading states everywhere:
   - Skeleton loaders for cards and tables
   - Smooth transitions

2. Error boundaries:
   - Catch and display errors gracefully
   - Retry buttons where appropriate

3. Mobile optimization:
   - Test on various screen sizes
   - Ensure touch targets are large enough
   - Fix any overflow/scroll issues

4. Performance:
   - Lazy load charts
   - Optimize images
   - Minimize bundle size

5. Accessibility:
   - Proper ARIA labels
   - Keyboard navigation
   - Color contrast check

6. Empty states:
   - No rounds yet
   - No favorite courses
   - No stats available

7. Notifications:
   - Toast notifications for save success/failure
   - Warning when leaving with unsaved changes
```

### Final Verification

- [ ] App works offline (can enter scores without internet)
- [ ] Scores sync when back online
- [ ] Optional stat tracking works
- [ ] Loading states show appropriately
- [ ] No console errors
- [ ] Mobile experience is smooth
- [ ] Can install as PWA
- [ ] Complete user journey works: register → add courses → start round → enter scores → complete → view stats

---

## Troubleshooting Common Issues

### Database Connection Errors
- Verify DATABASE_URL is correct
- Check Supabase dashboard for connection issues
- Ensure migrations have run

### Auth Issues
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your dev URL
- Clear cookies and try again

### Scorecard Not Saving
- Check browser console for errors
- Verify API endpoint returns 200
- Check localStorage for backup data

### Stats Not Calculating
- Ensure rounds are marked 'completed'
- Check that all scores are entered
- Verify handicap calculation function

---

## Deployment

When ready to deploy:

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel:
   - DATABASE_URL (from Supabase)
   - NEXTAUTH_SECRET (generate new for prod)
   - NEXTAUTH_URL (your production URL)
4. Deploy
5. Run `npx prisma migrate deploy` against production DB
6. Run seed script if needed for initial data
