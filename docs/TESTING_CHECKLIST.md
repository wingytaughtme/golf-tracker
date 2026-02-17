# Golf Tracker Testing Checklist

Use this checklist before deploying to production or after significant changes. Each section can be tested independently.

---

## Authentication Flow

- [ ] **Register new account** with valid email/password
- [ ] **Register fails** with invalid email format (shows error)
- [ ] **Register fails** with password < 8 characters (shows error)
- [ ] **Login** with valid credentials
- [ ] **Login fails** with wrong password (shows error, no sensitive info leaked)
- [ ] **Logout** clears session and redirects to login
- [ ] **Protected pages** redirect to login when logged out
- [ ] **Session persists** after browser refresh (while logged in)

---

## Round Management

### Creating Rounds
- [ ] **Create 9-hole round** - exactly 9 holes shown in scorecard
- [ ] **Create 18-hole round** - exactly 18 holes shown in scorecard
- [ ] **Each hole appears only once** (no duplicates)
- [ ] **Course selection** works and shows tee options
- [ ] **Tee set selection** works and shows correct ratings
- [ ] **Nine selection** works for courses with multiple nines
- [ ] **Player selection** allows adding 1-4 players

### Scoring
- [ ] **Enter scores** for individual holes
- [ ] **Auto-save works** - wait 2 seconds, refresh page, scores persist
- [ ] **Score colors** display correctly:
  - Eagle+ (2 under or more): Gold circle
  - Birdie (1 under): Green circle
  - Par: Plain/white
  - Bogey (1 over): Red border
  - Double bogey (2 over): Red double border
  - Triple+ (3+ over): Red filled

### Round Completion
- [ ] **Complete round** - status changes to "completed"
- [ ] **View completed round** - all scores display correctly
- [ ] **Edit completed round** scores works (as creator)
- [ ] **Delete round** works with confirmation

---

## Handicap Calculation

- [ ] **0-2 rounds**: Shows "Need more rounds" or handicap of 0
- [ ] **3+ rounds**: Handicap calculates and displays a value
- [ ] **Handicap chart** shows smooth progression (no wild jumps like 5 -> 26 -> 1)
- [ ] **Dashboard handicap** matches player profile handicap
- [ ] **Completing a round** updates handicap automatically

---

## Scorecard Display

- [ ] **Front/Back nine toggle** works (shows only selected nine)
- [ ] **Score totals** calculate correctly per nine
- [ ] **Par totals** are correct for 9 holes (e.g., 35 or 36)
- [ ] **Running totals** display correctly per player
- [ ] **Grid mode** allows keyboard navigation (Tab/Arrow keys)
- [ ] **Save status** indicator shows saving/saved/error states

---

## Course & Player Management

### Courses
- [ ] **Browse courses** list displays
- [ ] **Search courses** by name works
- [ ] **Favorite/unfavorite** courses works
- [ ] **Favorites list** updates immediately
- [ ] **Course details** show tee sets and ratings

### Players
- [ ] **View players** list displays
- [ ] **Player stats** display correctly
- [ ] **Add players** during round creation
- [ ] **Edit own profile** works
- [ ] **Cannot edit** other users' profiles (non-admin)

---

## User Permissions (Admin Feature)

### Regular User
- [ ] **Can edit** own rounds only
- [ ] **Can edit** scores on rounds they participate in
- [ ] **Can edit** own player profile only
- [ ] **Cannot edit** other users' player profiles
- [ ] **Cannot delete** rounds they didn't create

### Admin User
- [ ] **Can edit** any round
- [ ] **Can delete** any round
- [ ] **Can edit** any player profile
- [ ] **Can edit** scores on any completed round

To make yourself admin after registration:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Mobile Experience

- [ ] **Bottom navigation** works and highlights active page
- [ ] **Scorecard** scrolls horizontally on narrow screens
- [ ] **Touch input** on score cells works
- [ ] **New Round FAB** (floating action button) works
- [ ] **PWA installs** correctly (Add to Home Screen)
- [ ] **Offline page** shows when disconnected (if applicable)

---

## Dashboard

- [ ] **Stats cards** display correctly (rounds, handicap, avg score)
- [ ] **Recent rounds** list shows latest rounds
- [ ] **Handicap chart** renders without errors
- [ ] **Quick actions** work (new round, browse courses)

---

## Data Integrity

- [ ] **Scores save** correctly after page refresh
- [ ] **Handicap history** preserves past values
- [ ] **Favorite courses** persist between sessions
- [ ] **No data loss** after completing a round

---

## Error Handling

- [ ] **Network errors** show user-friendly messages
- [ ] **Invalid data** is rejected with clear error messages
- [ ] **404 pages** display for invalid URLs
- [ ] **Session expiry** redirects to login gracefully

---

## Performance

- [ ] **Page loads** in < 3 seconds
- [ ] **Scorecard** is responsive to input
- [ ] **Charts** render without freezing
- [ ] **No memory leaks** during extended use

---

## Notes

**Test Environment**:
- Browser: _____________
- Device: _____________
- Date: _____________

**Issues Found**:
1.
2.
3.

**Tester**: _____________
