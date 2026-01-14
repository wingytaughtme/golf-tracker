# Round Detail Scorecard View - Design Specification

## COLOR PALETTE

### Primary Brand Colors
- **Primary (Deep Hunter Green):** `#1E4D3B`
- **Secondary (Champagne Gold):** `#D4AF6A`
- **Gold Border/Accent:** `#B59A58`

### Background Colors
- **Page Background:** `#FAF8F2` (Cream/Ivory)
- **Card/Surface Background:** `#FDFBF7` (Lighter Cream)
- **Header/Navbar Background:** `#1E4D3B` (Deep Hunter Green)
- **OUT/IN/TOTAL Columns:** `bg-cream-300/70` (70% opacity cream-300)

### Text Colors
- **Primary Text:** `#1C1C1C` (Charcoal Black)
- **Secondary/Muted Text:** `#5D5D5D` (Dark Gray)
- **Forest Green Text:** `#2C3E2D` (Used on Par/Bogey scores)
- **Link Text:** `#D4AF6A` (Gold) or `#FFFFFF` (White in header)

### Score Indicator Colors (FINALIZED)

| Score Type | Background | Text Color | Shape | Border Effect |
|------------|------------|------------|-------|---------------|
| **Eagle (-2 or better)** | `#355E3B` (Hunter Green) | White | Circle (`rounded-full`) | Double ring: `border-2 border-white ring-2 ring-[#355E3B]` |
| **Birdie (-1)** | `#355E3B` (Hunter Green) | White | Circle (`rounded-full`) | None (solid) |
| **Par (0)** | Transparent | `#2C3E2D` (Forest Green) | None | None |
| **Bogey (+1)** | `#E8D9B5` (Champagne Gold) | `#2C3E2D` (Forest Green) | Square (`rounded-sm`) | None (solid) |
| **Double Bogey (+2)** | `#8C3A3A` (Deep Burgundy) | White | Square (`rounded-sm`) | None (solid) |
| **Triple+ (+3 or more)** | `#8C3A3A` (Deep Burgundy) | White | Square (`rounded-sm`) | Double ring: `border-2 border-white ring-2 ring-[#8C3A3A]` |

### Border Colors
- **Scorecard Double Border:** `#B59A58` (Muted Gold)
- **Cell Dividers:** `border-card-border/50` (50% opacity)

---

## SCORECARD DOUBLE BORDER FRAME

The scorecard uses a decorative double-border effect:

```css
/* Outer container */
.scorecard-outer {
  border-radius: 8px;           /* rounded-lg */
  padding: 4px;                 /* p-[4px] - creates the gap */
  border: 1px solid #B59A58;    /* gold border */
  background-color: #FDFBF7;    /* cream gap color */
  margin-top: 2px;              /* mt-0.5 */
  margin-bottom: 2px;           /* mb-0.5 */
  overflow-x: auto;
}

/* Inner container */
.scorecard-inner {
  border-radius: 4px;           /* rounded (not rounded-lg) */
  border: 1px solid #B59A58;    /* gold border */
  background-color: #FDFBF7;    /* cream background */
}
```

**Important:** Inner border uses `rounded` (4px) not `rounded-lg` (8px) so corners align properly with the outer border minus the padding.

---

## SCORE CELL STYLING

### Dimensions
- **Cell Size:** 26x26px (`w-[26px] h-[26px]`)
- **Font:** `text-sm font-mono` (14px monospace)

### Shape Logic
- **Under Par (Eagle, Birdie):** Circle shape (`rounded-full`)
- **Over Par (Bogey, Double, Triple+):** Square shape (`rounded-sm`)
- **Par:** No shape (transparent background)

### Double Ring Effect (Eagle & Triple+)
Used for exceptional scores (very good or very bad):
```css
border: 2px solid white;
ring: 2px solid [same-as-background];
```

### Score Label
- Labels appear **below** the score pill (not inside)
- Font: `text-[9px] font-medium text-charcoal`
- Labels: "Eagle", "Birdie", "Par", "Bogey", "Double", "Triple+"

---

## HOLE NUMBER CIRCLES

Displayed in the HOLE row as circular badges:

```css
.hole-number {
  width: 28px;                  /* w-7 */
  height: 28px;                 /* h-7 */
  border-radius: 50%;           /* rounded-full */
  background-color: #D3B57E;    /* Champagne Gold */
  color: #2C3E2D;               /* Forest Green */
  font-size: 12px;              /* text-xs */
  font-weight: 700;             /* font-bold */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## SCORECARD ROW STYLING

### Row Heights
- **Standard Rows (HOLE, HDCP, YARDS, PAR):** 48px (`h-12`)
- **Player Rows:** 48px minimum (`min-h-12`)

### Cell Widths
- **Hole Cells (1-18):** 48px (`w-12 min-w-[48px]`)
- **OUT/IN Columns:** 48px (`w-12 min-w-[48px]`)
- **TOTAL Column:** 64px (`w-16 min-w-[64px]`)
- **Label Column:** Variable width with `flex-1` to fill remaining space

### Compact Mode (Mobile)
- **Hole Cells:** 40px (`w-10 min-w-[40px]`)
- **TOTAL Column:** 56px (`w-14 min-w-[56px]`)
- **Label Column:** 80px minimum (`min-w-[80px]`)

### OUT/IN/TOTAL Columns
Background: `bg-cream-300/70` (cream at 70% opacity - slightly darker than regular cells)

### Label Column Styling
```css
.label-column {
  min-width: 96px;              /* min-w-[96px] */
  flex: 1;                      /* fills remaining space */
  padding: 0 12px;              /* px-3 */
  font-family: monospace;       /* font-mono */
  font-weight: 600;             /* font-semibold */
  font-size: 14px;              /* text-sm */
  text-transform: uppercase;    /* uppercase */
  letter-spacing: 0.05em;       /* tracking-wide */
}

/* Player names */
.player-label {
  font-size: 12px;              /* text-xs */
  text-transform: uppercase;
  word-wrap: break-word;
  line-clamp: 2;
}
```

---

## TYPOGRAPHY

### Font Families
- **Headers:** "Playfair Display", serif (`font-serif`)
- **Body/UI:** "Inter", sans-serif (`font-sans`)
- **Scorecard Numbers:** Monospace (`font-mono`)

### Font Sizes
| Element | Size |
|---------|------|
| Page Title (h1) | 36px |
| Section Headers (h2) | 20px |
| Card Titles (h3) | 16px |
| Body Text | 14px (`text-sm`) |
| Small/Caption | 12px (`text-xs`) |
| Score Labels | 9px (`text-[9px]`) |
| Data Numbers (Gross/Net) | 32px |
| Scorecard Cells | 14px (`text-sm`) |

### Font Weights
- 400: Body text
- 500: Medium labels
- 600: Semi-bold headers
- 700: Bold (scores, totals)

---

## PLAYER SUMMARY CARDS

Located below the scorecard grid:

```css
.player-summary-card {
  background: #FDFBF7;          /* bg-card */
  border-radius: 8px;           /* rounded-lg */
  border: 2px solid rgba(212, 175, 106, 0.3);  /* border-secondary/30 */
  padding: 12px;                /* p-3 */
  display: flex;
  align-items: center;
  gap: 12px;                    /* gap-3 */
}

.player-avatar {
  width: 48px;                  /* w-12 */
  height: 48px;                 /* h-12 */
  border-radius: 50%;           /* rounded-full */
  background: #D4AF6A;          /* bg-secondary */
  color: #1C1C1C;               /* text-charcoal */
  font-weight: 700;             /* font-bold */
  font-size: 18px;              /* text-lg */
}

.vs-par-positive { color: /* score-bogey color */ }
.vs-par-negative { color: /* score-birdie color */ }
.vs-par-even { color: #1C1C1C; }
```

---

## SPACING & LAYOUT

### Container
- **Max Width:** Responsive, no fixed max
- **Scorecard Min Width:** 800px desktop, 400px mobile (single nine)

### Spacing Scale
4px, 8px, 12px, 16px, 24px, 32px

### Margins
- **Scorecard to Header:** 2px (`mt-0.5`)
- **Scorecard to Footer:** 2px (`mb-0.5`)
- **Mobile View Toggle Gap:** 12px (`mb-3`)

---

## INTERACTIVE STATES

### Score Cell Hover/Focus
```css
.score-cell:hover {
  ring: 2px solid #D4AF6A;      /* ring-secondary */
  ring-offset: 1px;
}

.score-cell:focus {
  ring: 2px solid #D4AF6A;      /* ring-secondary */
  ring-offset: 2px;
  z-index: 10;
}
```

### Current Hole Indicator (Edit Mode)
```css
.current-hole {
  ring: 2px solid rgba(212, 175, 106, 0.5);  /* ring-secondary/50 */
  ring-offset: 1px;
}
```

---

## SAVE STATUS BAR (Edit Mode Only)

Located between scorecard header and grid:

- **Background:** `bg-cream-300`
- **Padding:** `px-4 py-2`
- **Border:** `border-b border-card-border`

### Status Indicators
| Status | Icon | Text Color |
|--------|------|------------|
| Saving | Spinner animation | `text-muted` |
| Saved | Checkmark | `text-score-birdie` (green) |
| Error | Warning circle | `text-score-triple` (red) |
| Offline | WiFi off | `text-score-bogey` (gold) |
| Unsaved | Pulsing dot | `text-score-bogey` (gold) |

---

## MOBILE CONSIDERATIONS

### View Toggle (Front 9 / Back 9 / All 18)
- Segmented control with rounded buttons
- Active: `bg-card shadow-sm`
- Inactive: `text-muted`
- Touch target: 44px minimum height

### Swipe Gestures
- Left swipe: Front 9 -> Back 9
- Right swipe: Back 9 -> Front 9
- Minimum swipe distance: 50px

---

## COMPONENT FILES

| Component | File | Purpose |
|-----------|------|---------|
| Main Scorecard | `components/scorecard/scorecard.tsx` | Container with header, grid, summary cards |
| Grid | `components/scorecard/scorecard-grid.tsx` | Double border wrapper, hole/player rows |
| Header | `components/scorecard/scorecard-header.tsx` | Course info, date, tee set |
| Row | `components/scorecard/scorecard-row.tsx` | Row template with label, cells, totals |
| Score Cell | `components/scorecard/score-cell.tsx` | Individual score with styling logic |
| Score Input | `components/scorecard/score-input.tsx` | Popover for detailed score entry |

---

## IMPLEMENTATION NOTES

### Traditional Golf Scorecard Conventions
1. **Circles** indicate under-par scores (good)
2. **Squares** indicate over-par scores (bad)
3. **Double rings** indicate exceptional scores (eagle, triple+)
4. **No decoration** for par

### Color Psychology
- **Hunter Green** (`#355E3B`): Success, achievement - used for under-par
- **Champagne Gold** (`#E8D9B5`): Caution, attention - used for bogey
- **Deep Burgundy** (`#8C3A3A`): Alert, needs improvement - used for double+

### Accessibility
- All score colors maintain sufficient contrast ratios
- Score cells have proper aria-labels for screen readers
- Keyboard navigation supported (arrow keys, tab, enter)
