# Golf Score Tracker - Complete Project Plan

## Project Overview

A full-stack web application for tracking golf scores with real course data, interactive scorecards, player profiles, and comprehensive statistics. The application must be mobile-responsive as primary use is on-course during rounds.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | Server components, excellent mobile perf, built-in API routes |
| Styling | Tailwind CSS | Rapid UI development, mobile-first utilities |
| Database | PostgreSQL | Relational data model fits golf data perfectly |
| ORM | Prisma | Type-safe queries, excellent migrations |
| Auth | NextAuth.js | Simple auth with multiple providers |
| Hosting | Vercel + Supabase | Free tier friendly, easy deployment |
| State | Zustand | Lightweight, perfect for scorecard state |
| Charts | Recharts | React-native charting for statistics |

---

## Database Schema

### Entity Relationship Summary

```
courses (1) ──< (M) tee_sets (1) ──< (18) holes
players (1) ──< (M) rounds (M) >── (1) courses
rounds (1) ──< (M) round_players (1) ──< (18) scores
```

### Table Definitions

#### `courses`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Course name |
| city | VARCHAR(100) | NOT NULL | City |
| state | VARCHAR(2) | NOT NULL | State abbreviation |
| zip_code | VARCHAR(10) | | Postal code |
| address | VARCHAR(255) | | Street address |
| phone | VARCHAR(20) | | Contact phone |
| website | VARCHAR(255) | | Course website |
| num_holes | INTEGER | DEFAULT 18 | 9 or 18 |
| course_type | VARCHAR(50) | | public/private/resort/municipal |
| latitude | DECIMAL(10,7) | | For GPS features |
| longitude | DECIMAL(10,7) | | For GPS features |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | | |

#### `tee_sets`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| course_id | UUID | FK → courses | |
| name | VARCHAR(50) | NOT NULL | e.g., "Championship", "Men's", "Senior" |
| color | VARCHAR(30) | NOT NULL | e.g., "Black", "Blue", "White", "Gold", "Red" |
| course_rating | DECIMAL(4,1) | NOT NULL | e.g., 72.4 |
| slope_rating | INTEGER | NOT NULL | 55-155, standard is 113 |
| total_yardage | INTEGER | | Calculated from holes |
| gender | VARCHAR(10) | | "M", "F", or NULL for unisex |

#### `holes`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tee_set_id | UUID | FK → tee_sets | |
| hole_number | INTEGER | NOT NULL, 1-18 | |
| par | INTEGER | NOT NULL, 3-6 | |
| distance | INTEGER | NOT NULL | Yards |
| handicap_index | INTEGER | NOT NULL, 1-18 | Hole difficulty ranking |
| UNIQUE | | (tee_set_id, hole_number) | |

#### `players`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users, NULLABLE | NULL for guest players |
| name | VARCHAR(100) | NOT NULL | Display name |
| email | VARCHAR(255) | UNIQUE | |
| ghin_number | VARCHAR(20) | | Official USGA handicap ID |
| home_course_id | UUID | FK → courses | |
| created_at | TIMESTAMP | | |

#### `users` (for authentication)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| password_hash | VARCHAR(255) | | For credentials auth |
| name | VARCHAR(100) | | |
| avatar_url | VARCHAR(255) | | |
| created_at | TIMESTAMP | | |

#### `rounds`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| course_id | UUID | FK → courses | |
| tee_set_id | UUID | FK → tee_sets | |
| created_by | UUID | FK → users | Who started the round |
| date_played | DATE | NOT NULL | |
| status | VARCHAR(20) | NOT NULL | 'in_progress', 'completed', 'abandoned' |
| round_type | VARCHAR(20) | DEFAULT 'casual' | 'casual', 'tournament', 'practice' |
| weather | VARCHAR(50) | | sunny/cloudy/rainy/windy |
| temperature | INTEGER | | Fahrenheit |
| notes | TEXT | | General round notes |
| started_at | TIMESTAMP | | When round began |
| completed_at | TIMESTAMP | | When round was submitted |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

#### `round_players`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| round_id | UUID | FK → rounds | |
| player_id | UUID | FK → players | |
| playing_handicap | DECIMAL(4,1) | | Handicap at time of round |
| gross_score | INTEGER | | Calculated total |
| net_score | DECIMAL(5,1) | | Gross minus handicap strokes |
| position | INTEGER | | 1-4, order on scorecard |
| UNIQUE | | (round_id, player_id) | |

#### `scores`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| round_player_id | UUID | FK → round_players | |
| hole_id | UUID | FK → holes | |
| strokes | INTEGER | | NULL until entered |
| putts | INTEGER | | Optional tracking |
| fairway_hit | BOOLEAN | | NULL for par 3s |
| green_in_regulation | BOOLEAN | | GIR tracking |
| penalties | INTEGER | DEFAULT 0 | Penalty strokes |
| sand_shots | INTEGER | DEFAULT 0 | Bunker shots |
| notes | VARCHAR(255) | | Hole-specific notes |
| UNIQUE | | (round_player_id, hole_id) | |

#### `handicap_history`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| player_id | UUID | FK → players | |
| handicap_index | DECIMAL(4,1) | NOT NULL | |
| effective_date | DATE | NOT NULL | |
| calculation_details | JSONB | | Differentials used |

---

## Feature Specifications

### F1: Course Database & Search

**Description:** Browse and search US golf courses with full hole-by-hole data.

**User Stories:**
- As a user, I can search for courses by name, city, or state
- As a user, I can filter courses by type (public/private) and number of holes
- As a user, I can view complete course details including all tee options
- As a user, I can see hole-by-hole par, distance, and handicap for any tee
- As a user, I can mark courses as favorites
- As a user, I can see courses I've recently played

**UI Components:**
- Course search page with filters
- Course detail page with tee selector
- Hole-by-hole data table
- Mini course card for lists

**Data Source Strategy:**
Since there's no free comprehensive golf course API, we'll use a hybrid approach:
1. Seed database with sample courses (50-100 popular courses)
2. Build an admin interface to add courses manually
3. Consider scraping public sources or purchasing data later
4. Allow users to request courses be added

---

### F2: Player Profiles & Management

**Description:** Create and manage player profiles for tracking.

**User Stories:**
- As a user, I can create my own player profile linked to my account
- As a user, I can create "guest" player profiles for my playing partners
- As a user, I can edit player details (name, GHIN number, home course)
- As a user, I can view any player's statistics dashboard
- As a user, I can set my home course for quick access

**UI Components:**
- Player profile page/dashboard
- Player edit form
- Player selector component (for adding to rounds)
- Player quick-create modal

---

### F3: Round Setup

**Description:** Configure a new round before starting to play.

**User Stories:**
- As a user, I can start a new round by selecting a course
- As a user, I can select which tee set we're playing from
- As a user, I can add 1-4 players to the round (including myself)
- As a user, I can set each player's playing handicap for the round
- As a user, I can specify the round type (casual/tournament/practice)
- As a user, I can add weather conditions
- As a user, I can cancel setup and return to dashboard

**UI Flow:**
1. Select course (search or recent/favorites)
2. Select tee set
3. Add players (auto-include self, add others)
4. Confirm handicaps
5. Start round → Navigate to scorecard

---

### F4: Interactive Scorecard (CRITICAL FEATURE)

**Description:** The core experience - an editable scorecard that mirrors a physical golf scorecard exactly.

**Visual Requirements:**
The scorecard MUST look like a real golf scorecard:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  COURSE NAME                                           Date: 01/07/2026        │
│  Tee: Blue (72.4 / 134)                               Weather: Sunny 72°F     │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬───────────────────┤
│HOLE │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │ OUT              │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────────┤
│HDCP │ 7   │ 15  │ 3   │ 11  │ 1   │ 13  │ 9   │ 5   │ 17  │                  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────────┤
│YARDS│ 425 │ 380 │ 545 │ 175 │ 460 │ 340 │ 410 │ 195 │ 520 │ 3450             │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────────┤
│PAR  │  4  │  4  │  5  │  3  │  4  │  4  │  4  │  3  │  5  │  36              │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────────┤
│Eric │ [4] │ [5] │ [ ] │ [ ] │ [ ] │ [ ] │ [ ] │ [ ] │ [ ] │  9               │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────────┤
│Mike │ [5] │ [4] │ [ ] │ [ ] │ [ ] │ [ ] │ [ ] │ [ ] │ [ ] │  9               │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────────┤
│     │     │     │     │     │     │     │     │     │     │                  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴───────────────────┘

(Same layout continues for holes 10-18 with IN and TOTAL columns)
```

**Score Display Conventions (IMPORTANT):**
- Eagle or better: Circle the score (gold/yellow background)
- Birdie: Circle the score (green background or green circle)
- Par: No decoration (neutral)
- Bogey: Square around score (light red/pink background)
- Double bogey+: Double square (darker red background)

**Interaction Requirements:**
- Tap/click a score cell to edit
- Number input appears (mobile-friendly large buttons 1-9, +, -)
- Score auto-saves on change (debounced)
- Running totals update in real-time
- Clear visual indicator of current hole being played
- Swipe or button to toggle Front 9 / Back 9 view on mobile

**Additional Tracking (Optional per Settings):**
- Putts per hole
- Fairway hit (checkbox, disabled for par 3s)
- GIR (checkbox)
- Penalty strokes

**Auto-Save Behavior:**
- Save to database every score change (debounced 2 seconds)
- Visual indicator showing "Saved" / "Saving..."
- Works offline with local storage, syncs when connection restored
- "Last saved: X minutes ago" indicator

**Round Controls:**
- "Save & Exit" - Save progress, return to dashboard
- "Complete Round" - Final submission, calculates handicap differential
- "Abandon Round" - Discard (with confirmation)

---

### F5: Player Dashboard & Statistics

**Description:** Comprehensive view of a player's golf history and performance.

**Statistics to Calculate:**

*Overall Stats:*
- Current Handicap Index (WHS calculation)
- Total rounds played
- Average score
- Best/worst rounds
- Scoring average by par (3/4/5)

*Detailed Stats:*
- Fairways hit % (exclude par 3s from denominator)
- Greens in regulation %
- Putts per round average
- Putts per GIR
- Scrambling % (up-and-down when missing GIR)
- Sand save %
- Penalty strokes per round

*Trends:*
- Handicap over time (line chart)
- Scoring average over time
- Stats by month/season

*Course-Specific:*
- Performance by course
- Best/worst holes at each course

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  PLAYER NAME                              Handicap: 12.4       │
│  Member since: Jan 2024                   Rounds: 47           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐│
│  │ Avg Score   │ │ Best Round  │ │ FIR %       │ │ GIR %     ││
│  │   84.2      │ │   78        │ │   62%       │ │   44%     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘│
│                                                                 │
│  [Handicap Trend Chart - Last 20 Rounds]                       │
│                                                                 │
│  RECENT ROUNDS                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Jan 5  │ Pine Valley GC      │ Blue │  82  │ +10  │ ↗      ││
│  │ Jan 1  │ Shadow Creek        │ White│  85  │ +13  │ ↘      ││
│  │ Dec 28 │ Pine Valley GC      │ Blue │  79  │ +7   │ ↗      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [View All Rounds]  [Detailed Stats]  [Course Breakdown]       │
└─────────────────────────────────────────────────────────────────┘
```

---

### F6: Handicap Calculation (WHS Compliant)

**Description:** Implement World Handicap System calculations.

**Formulas:**

*Score Differential:*
```
Score Differential = (113 / Slope Rating) × (Adjusted Gross Score - Course Rating - PCC)
```
- PCC (Playing Conditions Calculation) = 0 for our purposes (simplified)

*Handicap Index:*
- Take the best 8 differentials from the last 20 rounds
- Average them
- Apply 96% multiplier (soft cap logic for simplicity)
- Round to one decimal

*Equitable Stroke Control (ESC):*
Maximum score per hole based on course handicap:
- 9 or less: Double Bogey
- 10-19: 7
- 20-29: 8
- 30-39: 9
- 40+: 10

**Implementation Notes:**
- Store raw score AND adjusted score
- Recalculate handicap after each completed round
- Store handicap history with effective dates

---

## API Endpoints

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/courses | List/search courses |
| GET | /api/courses/:id | Get course with tee sets |
| GET | /api/courses/:id/holes?teeSetId= | Get holes for tee set |
| POST | /api/courses | Create course (admin) |
| PUT | /api/courses/:id | Update course (admin) |

### Players
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/players | List players for current user |
| GET | /api/players/:id | Get player with stats |
| GET | /api/players/:id/stats | Get detailed statistics |
| GET | /api/players/:id/rounds | Get player's rounds |
| POST | /api/players | Create player |
| PUT | /api/players/:id | Update player |

### Rounds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rounds | List user's rounds |
| GET | /api/rounds/:id | Get round with scores |
| GET | /api/rounds/active | Get in-progress rounds |
| POST | /api/rounds | Create new round |
| PUT | /api/rounds/:id | Update round details |
| PUT | /api/rounds/:id/complete | Complete round |
| DELETE | /api/rounds/:id | Delete/abandon round |

### Scores
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | /api/rounds/:roundId/scores | Batch update scores |
| PUT | /api/scores/:id | Update single score |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/profile | Get current user profile |
| PUT | /api/user/profile | Update profile |
| GET | /api/user/favorites | Get favorite courses |
| POST | /api/user/favorites/:courseId | Add favorite |
| DELETE | /api/user/favorites/:courseId | Remove favorite |

---

## UI/UX Design Guidelines

### Color Palette
```
Primary:      #1B4D3E (Forest Green - golf course inspired)
Secondary:    #2D5A27 (Fairway Green)
Accent:       #C5A572 (Sand/Gold - bunker inspired)
Background:   #F5F5F0 (Off-white - scorecard paper)
Text:         #1A1A1A (Near black)
Success:      #228B22 (Green - birdie)
Warning:      #DAA520 (Gold - eagle)
Error:        #CD5C5C (Indian Red - bogey+)
```

### Typography
- Headers: "Roboto Slab" or similar slab-serif (classic scorecard feel)
- Body: "Inter" or "Open Sans" (clean, readable)
- Scorecard numbers: Monospace or tabular figures

### Mobile-First Requirements
- Touch targets minimum 44x44px
- Scorecard must be usable one-handed
- Large number inputs for score entry
- Swipe gestures for navigation
- Offline capability with clear sync status

---

## Project Phases

### Phase 1: Foundation (Database + Auth + Basic UI)
- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up Prisma with PostgreSQL
- [ ] Create database schema and migrations
- [ ] Implement NextAuth.js authentication
- [ ] Build basic layout components (header, nav, footer)
- [ ] Create landing page

### Phase 2: Course Management
- [ ] Build course search page
- [ ] Create course detail page
- [ ] Implement tee set selector
- [ ] Build hole data display
- [ ] Seed database with sample courses (20-30)
- [ ] Add favorite courses feature

### Phase 3: Player Management
- [ ] Create player profile page
- [ ] Build player creation/edit forms
- [ ] Implement guest player creation
- [ ] Player selector component

### Phase 4: Round Setup
- [ ] Round creation wizard UI
- [ ] Course selection step
- [ ] Tee selection step  
- [ ] Player selection step
- [ ] Round configuration (type, weather)
- [ ] Create round API endpoints

### Phase 5: Scorecard (Core Feature)
- [ ] Build scorecard grid component
- [ ] Implement score entry cells
- [ ] Add score formatting (birdie circles, bogey squares)
- [ ] Running total calculations
- [ ] Auto-save functionality
- [ ] Save/Complete/Abandon controls
- [ ] Mobile optimization and gestures

### Phase 6: Statistics & Dashboard
- [ ] Implement handicap calculation
- [ ] Build player dashboard layout
- [ ] Create stat calculation queries
- [ ] Add trend charts
- [ ] Round history list
- [ ] Course-specific stats

### Phase 7: Polish & Advanced Features
- [ ] Offline support with service worker
- [ ] Push notifications for incomplete rounds
- [ ] Additional stat tracking (putts, FIR, GIR)
- [ ] Skins/games overlay
- [ ] Data export functionality
- [ ] Performance optimization

---

## Sample Course Data Structure

Here's an example of complete course data for seeding:

```json
{
  "name": "Pebble Beach Golf Links",
  "city": "Pebble Beach",
  "state": "CA",
  "zip_code": "93953",
  "address": "1700 17-Mile Drive",
  "phone": "(800) 654-9300",
  "website": "https://www.pebblebeach.com",
  "num_holes": 18,
  "course_type": "resort",
  "latitude": 36.5725,
  "longitude": -121.9486,
  "tee_sets": [
    {
      "name": "Tournament",
      "color": "Black",
      "course_rating": 75.5,
      "slope_rating": 145,
      "gender": "M",
      "holes": [
        { "hole_number": 1, "par": 4, "distance": 381, "handicap_index": 8 },
        { "hole_number": 2, "par": 5, "distance": 516, "handicap_index": 14 },
        { "hole_number": 3, "par": 4, "distance": 404, "handicap_index": 6 },
        { "hole_number": 4, "par": 4, "distance": 331, "handicap_index": 12 },
        { "hole_number": 5, "par": 3, "distance": 195, "handicap_index": 16 },
        { "hole_number": 6, "par": 5, "distance": 523, "handicap_index": 2 },
        { "hole_number": 7, "par": 3, "distance": 106, "handicap_index": 18 },
        { "hole_number": 8, "par": 4, "distance": 428, "handicap_index": 4 },
        { "hole_number": 9, "par": 4, "distance": 505, "handicap_index": 10 },
        { "hole_number": 10, "par": 4, "distance": 446, "handicap_index": 5 },
        { "hole_number": 11, "par": 4, "distance": 390, "handicap_index": 9 },
        { "hole_number": 12, "par": 3, "distance": 202, "handicap_index": 15 },
        { "hole_number": 13, "par": 4, "distance": 445, "handicap_index": 3 },
        { "hole_number": 14, "par": 5, "distance": 580, "handicap_index": 1 },
        { "hole_number": 15, "par": 4, "distance": 397, "handicap_index": 11 },
        { "hole_number": 16, "par": 4, "distance": 403, "handicap_index": 7 },
        { "hole_number": 17, "par": 3, "distance": 178, "handicap_index": 17 },
        { "hole_number": 18, "par": 5, "distance": 543, "handicap_index": 13 }
      ]
    },
    {
      "name": "Blue",
      "color": "Blue",
      "course_rating": 73.8,
      "slope_rating": 140,
      "gender": "M",
      "holes": [
        { "hole_number": 1, "par": 4, "distance": 357, "handicap_index": 8 }
        // ... remaining holes with shorter distances
      ]
    }
  ]
}
```

---

## File Structure

```
golf-tracker/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Main dashboard
│   │   ├── courses/
│   │   │   ├── page.tsx                # Course search
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Course detail
│   │   ├── players/
│   │   │   ├── page.tsx                # Player list
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Player profile/stats
│   │   ├── rounds/
│   │   │   ├── page.tsx                # Round history
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Round setup wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Scorecard view
│   │   │       └── summary/
│   │   │           └── page.tsx        # Post-round summary
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── courses/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── players/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── stats/
│   │   │           └── route.ts
│   │   ├── rounds/
│   │   │   ├── route.ts
│   │   │   ├── active/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── complete/
│   │   │       │   └── route.ts
│   │   │       └── scores/
│   │   │           └── route.ts
│   │   └── user/
│   │       └── profile/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx                        # Landing page
├── components/
│   ├── ui/                             # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── modal.tsx
│   │   └── ...
│   ├── courses/
│   │   ├── course-card.tsx
│   │   ├── course-search.tsx
│   │   ├── tee-selector.tsx
│   │   └── hole-table.tsx
│   ├── players/
│   │   ├── player-card.tsx
│   │   ├── player-form.tsx
│   │   ├── player-selector.tsx
│   │   └── player-stats.tsx
│   ├── rounds/
│   │   ├── round-setup-wizard.tsx
│   │   └── round-card.tsx
│   ├── scorecard/
│   │   ├── scorecard.tsx               # Main scorecard component
│   │   ├── scorecard-header.tsx
│   │   ├── scorecard-row.tsx
│   │   ├── score-cell.tsx
│   │   ├── score-input.tsx
│   │   └── scorecard-controls.tsx
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   ├── handicap-chart.tsx
│   │   └── recent-rounds.tsx
│   └── layout/
│       ├── header.tsx
│       ├── nav.tsx
│       └── footer.tsx
├── lib/
│   ├── prisma.ts                       # Prisma client
│   ├── auth.ts                         # NextAuth config
│   ├── utils.ts                        # Utility functions
│   └── calculations/
│       ├── handicap.ts                 # WHS calculations
│       ├── statistics.ts               # Stat calculations
│       └── scoring.ts                  # Score formatting
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                         # Database seeding
├── stores/
│   └── scorecard-store.ts              # Zustand store for scorecard
├── types/
│   └── index.ts                        # TypeScript types
├── public/
│   └── ...
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Testing Checklist

### Phase 1 Verification
- [ ] Can create account and log in
- [ ] Database tables created correctly
- [ ] Basic navigation works

### Phase 2 Verification
- [ ] Can search for courses
- [ ] Course detail shows all tee sets
- [ ] Hole data displays correctly
- [ ] Can mark course as favorite

### Phase 3 Verification
- [ ] Can create player profile
- [ ] Can create guest players
- [ ] Can edit player information

### Phase 4 Verification
- [ ] Can complete round setup wizard
- [ ] Round created in database with correct associations

### Phase 5 Verification
- [ ] Scorecard displays correctly (matches reference design)
- [ ] Can enter scores for all players
- [ ] Scores save automatically
- [ ] Running totals calculate correctly
- [ ] Score formatting (birdie/bogey) displays correctly
- [ ] Can complete round
- [ ] Can save and exit mid-round
- [ ] In-progress round persists and can be resumed

### Phase 6 Verification
- [ ] Handicap calculates correctly
- [ ] Dashboard displays accurate stats
- [ ] Charts render correctly
- [ ] Round history displays all rounds

---

## Claude Code Implementation Instructions

### How to Use This Plan

Feed this plan to Claude Code in phases. After each phase, verify the checklist items work before proceeding.

### Phase 1 Prompt

```
I'm building a golf score tracking application. Here's the complete plan:
[paste entire plan]

Let's start with Phase 1: Foundation.

Please:
1. Initialize a new Next.js 14 project with TypeScript and the App Router
2. Install and configure Tailwind CSS
3. Set up Prisma with PostgreSQL (I'll use Supabase for hosting)
4. Create the complete database schema from the plan
5. Set up NextAuth.js with credentials authentication
6. Build the basic layout components (header, nav shell)
7. Create a simple landing page

Use the exact file structure from the plan. After each major step, pause and let me verify before continuing.
```

### Phase 2 Prompt

```
Phase 1 is complete and verified. Continue with Phase 2: Course Management.

Using the established project structure and schema, please:
1. Build the course search page with filters
2. Create the course detail page with tee set selector
3. Implement the hole data display table
4. Create the seed script with 25-30 real US courses (research actual course data)
5. Add the favorite courses feature

Start with the course search page and API endpoint.
```

### Phase 3 Prompt

```
Phase 2 is complete. Continue with Phase 3: Player Management.

Please:
1. Create the player profile page showing basic info
2. Build the player creation/edit form
3. Implement guest player creation modal
4. Create the reusable player selector component

Start with the player model API endpoints, then build the UI.
```

### Phase 4 Prompt

```
Phase 3 is complete. Continue with Phase 4: Round Setup.

Please build the round setup wizard:
1. Step 1: Course selection (integrate with existing course search)
2. Step 2: Tee set selection 
3. Step 3: Player selection (use the player selector component)
4. Step 4: Round configuration (type, weather, date)
5. Create round button that creates the round and navigates to scorecard

Make this a multi-step wizard with back/next navigation.
```

### Phase 5 Prompt

```
Phase 4 is complete. Now for the most critical phase - Phase 5: Scorecard.

This is the core feature. The scorecard MUST look exactly like a real golf scorecard. Reference the visual design in the plan.

Please:
1. Build the scorecard grid component matching the exact visual layout in the plan
2. Implement score cells with tap-to-edit functionality
3. Add score formatting (green circle for birdie, red square for bogey, etc.)
4. Implement auto-save with debouncing (2 second delay)
5. Add "Saving..." / "Saved" indicator
6. Build the running total calculations
7. Add the control buttons (Save & Exit, Complete Round, Abandon)
8. Optimize for mobile (large touch targets, swipe between front/back 9)

Start with the basic grid layout and static display, then add interactivity.
```

### Phase 6 Prompt

```
Phase 5 is complete. Continue with Phase 6: Statistics & Dashboard.

Please:
1. Implement the WHS handicap calculation following the formulas in the plan
2. Build the player dashboard layout matching the design in the plan
3. Create database queries for all statistics
4. Add the handicap trend chart using Recharts
5. Build the round history list
6. Add course-specific statistics view

Start with the handicap calculation logic, then build the dashboard UI.
```

### Phase 7 Prompt

```
Phase 6 is complete. Final phase - Phase 7: Polish.

Please:
1. Add a service worker for offline support
2. Implement local storage backup for in-progress scorecards
3. Add sync logic for when connection is restored
4. Add additional stat tracking inputs to scorecard (putts, FIR, GIR toggles)
5. Performance optimization (lazy loading, image optimization)
6. Final mobile polish and testing

Focus on the offline experience first since this is critical for on-course use.
```

---

## Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional: OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## Deployment Checklist

- [ ] Supabase PostgreSQL database created
- [ ] Environment variables configured in Vercel
- [ ] Database migrations run on production
- [ ] Seed data loaded
- [ ] NextAuth configured for production URL
- [ ] Domain configured (optional)
- [ ] SSL working

---

## Future Enhancements (Post-MVP)

1. **Native Mobile App** - React Native version for better offline/GPS
2. **GHIN Integration** - Post scores directly to official handicap
3. **Social Features** - Friend leaderboards, share rounds
4. **AI Insights** - "You score 2 strokes better on par 5s in the morning"
5. **Course GPS** - Show hole layouts and distances
6. **Shot Tracking** - Full shot-by-shot tracking with club selection
7. **Betting/Games** - Automated skins, Nassau, wolf calculations
8. **Tournament Mode** - Multi-round tournaments with leaderboards
