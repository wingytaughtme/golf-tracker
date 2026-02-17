# Production Readiness Plan

## Overview

Prepare golf-tracker for production deployment with focus on:
- Manual testing workflow for regression prevention
- Rebranding and design refresh
- Vercel deployment with custom domain
- Database cleanup and course expansion
- Admin permissions for family sharing
- Professional polish

---

## 1. Testing Strategy (Manual Checklist)

Since you'll be the primary maintainer and testing automated suites is overkill for personal/family use, I'll create a **comprehensive manual test checklist** you can run before releases.

### Deliverable: `/docs/TESTING_CHECKLIST.md`

**Authentication Flow**
- [ ] Register new account with valid email/password
- [ ] Register fails with invalid email format
- [ ] Register fails with password < 8 characters
- [ ] Login with valid credentials
- [ ] Login fails with wrong password
- [ ] Logout clears session
- [ ] Protected pages redirect to login when logged out

**Round Management**
- [ ] Create 9-hole round - exactly 9 holes shown
- [ ] Create 18-hole round - exactly 18 holes shown
- [ ] Each hole appears only once (no duplicates)
- [ ] Enter scores for all holes
- [ ] Auto-save works (wait 2 seconds, refresh, scores persist)
- [ ] Complete round - status changes to completed
- [ ] View completed round - scores display correctly
- [ ] Edit completed round scores (as creator)
- [ ] Delete round

**Handicap Calculation**
- [ ] Complete 1-2 rounds - handicap shows 0 or "Need more rounds"
- [ ] Complete 3+ rounds - handicap calculates correctly
- [ ] Handicap chart shows smooth progression (no wild jumps)
- [ ] Dashboard handicap matches player profile handicap

**Scorecard Display**
- [ ] Front/Back nine toggle works
- [ ] Score colors correct (birdie=green, bogey=red border, etc.)
- [ ] Running totals calculate correctly
- [ ] Par totals correct for 9 and 18

**Course & Player Management**
- [ ] Search courses by name
- [ ] Favorite/unfavorite courses
- [ ] Add players to a round
- [ ] Player stats display correctly

**Mobile Experience**
- [ ] Bottom navigation works
- [ ] Scorecard scrolls horizontally
- [ ] Touch input on score cells works
- [ ] PWA installs correctly (Add to Home Screen)

---

## 2. Design & Branding Refresh

### App Name Ideas

| Name | Vibe | Domain Check Needed |
|------|------|---------------------|
| **Fairway** | Clean, golf-specific | fairwayapp.com |
| **LinksLog** | Traditional golf term + logging | linkslog.com |
| **CardKeeper** | Scorecard focused | cardkeeper.app |
| **RoundTrack** | Action-oriented | roundtrack.app |
| **MyLinks** | Personal, golf term | mylinks.golf |
| **GreenSide** | Golf location reference | greensideapp.com |
| **The 19th** | Golf culture (19th hole = clubhouse) | the19th.app |
| **Birdie Book** | Positive, notebook feel | birdiebook.app |

**Recommendation**: "Fairway" or "Birdie Book" - both are memorable, golf-specific, and professional sounding.

### Theme/Design Options

**Current**: Dark forest green (#1B4D3E) + gold accent (#C5A572)

**Option A: Modern Minimalist**
- Primary: Deep navy (#1E3A5F)
- Accent: Bright green (#22C55E)
- Feel: Clean, app-like, less "country club"

**Option B: Premium Classic**
- Primary: Hunter green (#355E3B)
- Accent: Champagne gold (#F7E7CE)
- Feel: Augusta-inspired, prestigious

**Option C: Fresh & Friendly**
- Primary: Teal (#0D9488)
- Accent: Coral (#F97316)
- Feel: Modern, approachable, less traditional

**What I Can Do**:
- Update Tailwind config with new colors
- Refresh component styles
- Create new logo SVG concepts
- Update PWA manifest colors

**What I Cannot Do**:
- Create high-fidelity mockups/designs (no image generation)
- Design actual logo graphics files

**Recommendation**: For mockups, use tools like Figma (free) or describe your vision and I'll implement it directly in code - you can iterate by seeing the actual app.

---

## 3. Deployment to Production

### Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| **Vercel Hosting** | Free (Hobby tier) | Forever |
| **Supabase Database** | Free tier (500MB, 2 projects) | Forever |
| **Custom Domain (.com)** | $10-15 | Annual renewal |
| **Custom Domain (.app)** | $14-20 | Annual renewal |
| **.golf domain** | $40-50 | Annual renewal |

**Total: ~$10-50/year** (just the domain)

### Deployment Steps

#### Step 1: Prepare Repository
```bash
# Ensure all changes committed
git add .
git commit -m "Prepare for production"
git push origin main
```

#### Step 2: Create Vercel Account & Deploy
1. Go to vercel.com, sign up with GitHub
2. Click "Import Project" → Select golf-tracker repo
3. Vercel auto-detects Next.js settings
4. Add environment variables:
   - `DATABASE_URL` (from Supabase)
   - `DIRECT_URL` (from Supabase)
   - `NEXTAUTH_SECRET` (generate new: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your domain, e.g., `https://fairway.app`)
5. Click Deploy

#### Step 3: Purchase Domain
**Recommended Registrars**:
- Namecheap ($10-12/year for .com)
- Google Domains ($12/year)
- Cloudflare ($8-10/year, cheapest)

#### Step 4: Connect Domain to Vercel
1. In Vercel dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS at registrar (Vercel provides instructions)
4. SSL certificate auto-provisioned (free)

#### Step 5: Update Production Database
Option A: Use existing Supabase project (has test data)
Option B: Create fresh Supabase project for production

---

## 4. Database Cleanup

### What to Remove (Test Data)
- Demo user: `demo@example.com`
- Test players: john@example.com, mike@example.com, sarah@example.com
- All rounds and scores
- All handicap history
- All favorite courses

### What to Keep
- All 25 seeded courses
- Course tee sets and hole data

### Cleanup Script: `scripts/clean-for-production.ts`

```typescript
// Will delete:
// - All users
// - All players
// - All rounds (cascades to scores, round_players)
// - All handicap_history
// - All favorite_courses
// - All score_edits

// Will keep:
// - Courses
// - Nines
// - Tee sets
// - Holes
// - Tee nine ratings
```

### Fresh Start Approach (Recommended)

Instead of cleaning, create a **new Supabase project** for production:
1. Create new project at supabase.com
2. Run `npx prisma db push` to create schema
3. Run `npm run db:seed` (modify seed to skip demo users)
4. Update Vercel env vars with new connection strings

This guarantees zero test data contamination.

---

## 5. Expanding Course Database

### Adding Top 10 Courses Per State

**Effort Estimate**:
- 50 states × 10 courses = 500 courses
- Each course needs: name, city, state, address, coordinates, 2-4 tee sets, 18 holes of data
- **Manual entry**: 10-15 min per course = 80-125 hours
- **Not practical for manual entry**

### Better Approaches

**Option A: Gradual User-Added Courses**
- Already planned course creation feature
- Users add courses as they play them
- Builds organically based on actual usage

**Option B: Import from Golf Course API**
- Services like GolfCourseAPI.com ($50-100/month)
- Could seed hundreds of courses programmatically
- One-time script, then cancel subscription

**Option C: Curated Regional Expansion**
- Add 5-10 courses you/family actually play
- Focus on your home state + vacation spots
- I can help add specific courses if you provide the data

**Recommendation**: Start with Option A (user-created courses). Add specific courses manually as needed. The 25 famous courses provide a good starting point.

---

## 6. Admin & User Permissions

### Current Security Issue
Any authenticated user can edit ANY player profile via `PUT /api/players/[id]`. This needs fixing regardless of admin implementation.

### Proposed Permission Model (Simple)

```
User Roles:
├── admin (you) - Can do everything
└── user (family) - Standard access

Admin Capabilities:
├── Edit any round (even others' rounds)
├── Delete any round
├── Edit any player profile
├── View all users' data
├── Access admin dashboard (future)
└── Manage courses

User Capabilities:
├── Create/edit/delete own rounds
├── Edit scores on rounds they participate in
├── Edit own player profile only
├── View shared round data (if participant)
└── Cannot access others' data
```

### Implementation

**Schema Change** (`prisma/schema.prisma`):
```prisma
enum UserRole {
  admin
  user
}

model User {
  // ... existing fields
  role UserRole @default(user)
}
```

**Files to Modify**:
- `prisma/schema.prisma` - Add role field
- `lib/auth.ts` - Include role in session
- `types/next-auth.d.ts` - Add role to types
- `app/api/players/[id]/route.ts` - Fix security, add admin check
- `app/api/rounds/[id]/route.ts` - Add admin bypass

**Admin Assignment**:
After you create your production account, manually set your role to admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 7. Professional Polish Checklist

### Security Fixes (Critical)
- [ ] Fix player edit endpoint - require ownership or admin
- [ ] Add rate limiting to auth endpoints (prevent brute force)
- [ ] Validate all user inputs server-side

### UX Improvements
- [ ] Add "Forgot Password" flow (requires email service)
- [ ] Improve error messages (user-friendly, not technical)
- [ ] Add loading states to all async operations
- [ ] Confirm dialogs before destructive actions (delete round)

### Legal/Compliance
- [ ] Privacy Policy page (what data you collect)
- [ ] Terms of Service page
- [ ] Cookie consent (if using analytics)

### Performance
- [ ] Optimize images (WebP format, lazy loading)
- [ ] Add page-level caching where appropriate
- [ ] Database indexes on frequently queried fields

### Analytics (Optional)
- [ ] Vercel Analytics (free tier available)
- [ ] Simple usage tracking (rounds created, active users)

### Backup Strategy
- [ ] Supabase has automatic daily backups (free tier: 7 days)
- [ ] Consider manual export before major changes

---

## 8. Implementation Order

### Phase 1: Critical Fixes (Do First)
1. Fix player edit security vulnerability
2. Create production Supabase database
3. Deploy to Vercel
4. Purchase and connect domain

### Phase 2: Polish
5. Add admin role system
6. Update branding/colors (if desired)
7. Create testing checklist document

### Phase 3: Enhancement (Optional)
8. Add forgot password flow
9. Privacy/Terms pages
10. Expand course database

---

## Verification

After deployment:
1. Register new account on production site
2. Run through entire testing checklist
3. Create a real round and verify scores save
4. Check handicap calculates after 3+ rounds
5. Test on mobile device (PWA install)
6. Have family member create account and verify they can't edit your data

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `docs/TESTING_CHECKLIST.md` | Create | Manual test workflow |
| `scripts/clean-for-production.ts` | Create | Database cleanup |
| `prisma/schema.prisma` | Modify | Add UserRole enum |
| `lib/auth.ts` | Modify | Include role in session |
| `types/next-auth.d.ts` | Modify | Type role |
| `app/api/players/[id]/route.ts` | Modify | Fix security |
| `tailwind.config.ts` | Modify | If rebranding |
| `app/layout.tsx` | Modify | If renaming app |
| `public/manifest.json` | Modify | If renaming app |
