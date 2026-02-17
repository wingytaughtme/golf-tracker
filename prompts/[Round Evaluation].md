[Round Evaluation]

Part 1: Application Context (Static)

  You are a senior UX designer and frontend developer conducting a thorough design review of a golf score tracking web application. Analyze the attached screenshot with a critical eye for usability, consistency, and visual polish.

  ## Application Overview
  **Birdie Book** is a premium golf score tracking application built for serious golfers who want to:
  - Track scores during rounds with an interactive digital scorecard
  - Calculate and monitor their USGA handicap index over time
  - Review detailed statistics and performance trends
  - Manage course information and tee set data
  - View round history and scoring breakdowns

  The application is mobile-first (used on-course during rounds) but also serves as a desktop dashboard for reviewing statistics and history.

  ## Design System: "Birdie Book" Premium Golf Theme

  ### Color Palette
  | Purpose | Color | Hex |
  |---------|-------|-----|
  | Primary (Brand) | Deep Hunter Green | #1E4D3B |
  | Secondary (Accent) | Champagne Gold | #D4AF6A |
  | Gold Borders | Muted Gold | #B59A58 |
  | Page Background | Cream/Ivory | #FAF8F2 |
  | Card Background | Light Cream | #FDFBF7 |
  | Primary Text | Charcoal | #1C1C1C |
  | Secondary Text | Muted Gray | #5D5D5D |

  ### Score Indicator Colors (Critical for Scorecards)
  | Score Type | Background | Text | Shape |
  |------------|------------|------|-------|
  | Eagle (-2 or better) | #355E3B | White | Circle with double ring |
  | Birdie (-1) | #355E3B | White | Circle |
  | Par (even) | Transparent | #2C3E2D | None |
  | Bogey (+1) | #E8D9B5 | #2C3E2D | Square |
  | Double Bogey (+2) | #8C3A3A | White | Square |
  | Triple+ (+3 or more) | #8C3A3A | White | Square with double ring |

  ### Typography
  - **Headings:** Playfair Display (serif) - elegant, premium feel
  - **Body/UI:** Inter (sans-serif) - clean, readable
  - **Scorecard Numbers:** Monospace - tabular alignment for data grids

  ### Component Patterns
  - **Cards:** 8px border radius, subtle shadow, #FDFBF7 background
  - **Buttons:** 6px border radius, primary uses Hunter Green, secondary uses gold outline
  - **Scorecard Frame:** Decorative double-border (1px gold outer, 4px cream gap, 1px gold inner)
  - **Hole Number Badges:** Gold circles (#D3B57E) with forest green text (#2C3E2D)
  - **OUT/IN/TOTAL Columns:** Slightly darker background (bg-cream-300/70)
  - **Data Tables:** Monospace font, consistent cell widths, cream row backgrounds

  ### Spacing Scale
  4px, 8px, 12px, 16px, 24px, 32px (consistent throughout)

  ---

  Part 2: Page-Specific Evaluation (Customize This Section)

  ---

  ## Page Under Review

  ### Page Identity
  - **Page Name:** Round Detail - Scorecard View
  - **URL Path:** /rounds/[id]
  - **Screenshot:** [Attached]

  ### Page Purpose
  Display a completed golf round with full scorecard data and player performance summary. This is the primary view users see when reviewing past rounds.

  ### Target Users
  - Golfers reviewing their completed rounds
  - Players checking their scores and statistics after a round
  - Users comparing their performance across different rounds

  ### Key User Tasks on This Page
  1. View the complete scorecard with all 18 holes, par, yardage, and handicap data
  2. See their score for each hole with visual indicators (birdie circles, bogey squares, etc.)
  3. Review front 9 (OUT), back 9 (IN), and total scores
  4. View player summary cards showing gross score, net score, and vs par
  5. Navigate to edit scores or view detailed round summary
  6. Understand at a glance how they performed (color-coded scores)

  ### Expected Components on This Page
  - Page header with course name, date, and round status
  - Scorecard header (course info, tee set, rating/slope, weather)
  - Full 18-hole scorecard grid with:
    - HOLE row (1-18 with gold circle badges)
    - HDCP row (hole handicap rankings)
    - YARDS row (distances)
    - PAR row (par values)
    - Player row(s) with scores and visual indicators
    - OUT/IN/TOTAL summary columns
  - Player summary cards at bottom (avatar, name, handicap, gross, net, vs par)
  - Score summary row (total par, total yards, rating/slope)
  - Action buttons (Edit Scores, View Summary, etc.)

  ### Design Requirements Specific to This Page
  - Scorecard must use the double-border decorative frame
  - Score cells must use traditional golf shapes (circles for under par, squares for over par)
  - Score labels (Eagle, Birdie, Par, Bogey, Double, Triple+) should appear below the score pill
  - Player summary cards should have gold accent borders
  - The scorecard should NOT require horizontal scrolling on desktop views

  ---

  ## Evaluation Tasks

  ### 1. Purpose & Usability Analysis
  - Does the page clearly show the round information at a glance?
  - Is the scorecard easy to read and understand?
  - Can users quickly identify good scores (green) vs bad scores (burgundy)?
  - Is the player summary information clear and well-organized?
  - Are the navigation options (back, edit, summary) easy to find?
  - What information might be missing that golfers would want to see?

  ### 2. Layout & Spacing Critique
  - Is the scorecard properly sized for the viewport?
  - Is there appropriate spacing between the scorecard and other elements?
  - Are the player summary cards well-balanced?
  - Does the information hierarchy make sense (most important info most prominent)?
  - Are there any areas that feel cramped or too sparse?

  ### 3. Visual Consistency Audit
  Check EVERY element against the design system and flag inconsistencies:
  - [ ] Score cell colors match the defined palette?
  - [ ] Score shapes correct (circles for under par, squares for over par)?
  - [ ] Double ring effect present on Eagle and Triple+ scores?
  - [ ] Hole number badges using gold background (#D3B57E)?
  - [ ] OUT/IN/TOTAL columns have slightly darker background?
  - [ ] Double-border frame on scorecard using correct gold (#B59A58)?
  - [ ] Typography correct (Playfair for headings, Inter for body, Monospace for numbers)?
  - [ ] Player summary cards styled consistently?
  - [ ] Button styles match the design system?
  - [ ] Spacing values from the defined scale?

  ### 4. Scorecard-Specific Review
  - Are all score cells the same size and aligned?
  - Do the score labels appear correctly below the pills?
  - Is the font size appropriate for readability?
  - Are the row labels (HOLE, HDCP, YARDS, PAR) styled consistently?
  - Do the subtotal columns (OUT, IN, TOTAL) stand out appropriately?
  - Is the decorative double-border rendering correctly at all corners?

  ### 5. Player Summary Cards Review
  - Are the cards visually balanced?
  - Is the avatar/initials display consistent?
  - Are the stats (Gross, Net, vs Par) clearly labeled?
  - Is the vs Par color-coded correctly (green for under, red for over)?
  - Do the cards have appropriate borders/accents?

  ### 6. Accessibility Concerns
  - Is text contrast sufficient on all score cell backgrounds?
  - Are the score shapes distinguishable for colorblind users?
  - Are touch targets large enough for mobile use?
  - Is the information hierarchy clear for screen readers?

  ---

  ## Output Format

  ### Executive Summary
  [2-3 sentences on overall impression and biggest issues]

  ### Critical Issues (Must Fix)
  [Numbered list of problems that significantly impact usability or break design consistency]

  ### Improvements (Should Fix)
  [Numbered list of issues that would improve the experience but aren't critical]

  ### Minor Polish (Nice to Have)
  [Numbered list of small refinements for extra polish]

  ### Styling Inconsistencies - Detailed List
  For EVERY element that doesn't match the design system:

  | Element | Current State | Expected State | Fix Required |
  |---------|---------------|----------------|--------------|
  | [e.g., Birdie score cell] | [bg-green-500] | [#355E3B] | [Update background color] |

  ### Positive Observations
  [What's working well and should be preserved]

  ### Suggested Mockup Changes
  [If you could redesign any part of this page, what would you change and why?]