[rounds_list]

COLOR PALETTE
Primary color (main brand color): #1E4D3B (Deep Hunter Green)

Secondary color: #D4AF6A (Champagne Gold/Antique Brass)

Accent color: #C29452 (Gold for pill backgrounds/icons)

Background colors:

Page background: #FAF8F2 (Cream/Ivory)

Card/surface background: #FAF8F2 (Cream - Table rows), #1E4D3B (Table Header)

Header/navbar background: #FAF8F2 (Filter Bar bg)

Text colors:

Primary text: #1C1C1C (Charcoal Black)

Secondary/muted text: #5D5D5D (Dark Gray - dates, location)

Link text: #1E4D3B (Underlined "Clear Filters")

State colors:

Success/positive: #C8E6C9 (Light Green bg for "Completed" pill) with #2E7D32 text

Warning: #FFE082 (Light Gold bg for "In Progress" pill) with #8D6E63 text

Error/negative: Not explicitly shown, but typically red.

Border colors: #D4AF6A (Gold - inputs, buttons)

TYPOGRAPHY
Heading font family: "Playfair Display", serif

Body font family: "Inter", sans-serif

Font sizes:

Page title (h1): 36px (e.g., "Round History")

Section headers (h2): Not present.

Card titles (h3): Not present.

Table Header Text: 14px, Bold

Body text: 14px (Table data)

Small/caption text: 12px (e.g., "24 rounds total", location subtitle)

Font weights used:

400 (Body text)

500 (Medium for pills/status)

700 (Bold for table headers)

Line heights: 1.5 (Standard)

Letter spacing if notable: Normal

SPACING & LAYOUT
Page max-width: 1200px (Centered container)

Page padding/margins: Top: 40px; Side Margins: 40px

Card padding: 24px (Filter bar)

Gap between cards/sections: 24px (Between title, filters, table, footer)

Grid columns:

Table: 7 Columns (Date, Course, Tees, Score/Par, Players, Status, Actions)

Standard spacing scale: 8px, 12px, 16px, 24px, 32px

BORDERS & CORNERS
Border radius:

Cards (Filter Bar, Table Container): 8px

Buttons: 6px

Inputs/Selects: 6px

Badges/pills: 16px (Status pills)

Border widths: 1px

Border styles: Solid

SHADOWS
Card shadows: 0 2px 4px rgba(0,0,0,0.05) (Subtle lift on table rows and filter bar)

Elevated elements: Filter bar and Table Container

Hover state shadows: 0 4px 8px rgba(0,0,0,0.1) (Implied on rows)

BUTTONS
Primary button ("New Round"):

Background: #1E4D3B (Hunter Green)

Text color: #D4AF6A (Gold) or #FFFFFF (White)

Padding: 10px 20px

Border radius: 6px

Font weight: 500

Secondary button (Pagination "1", "2", "3", "Next"):

Background: Transparent or #D4AF6A (Gold for active page "1")

Text color: #D4AF6A (Gold) or #FFFFFF (White on active)

Border: 1px solid #D4AF6A

Padding: 6px 12px

Text/link button ("Clear Filters"):

Background: None

Text color: #1E4D3B (Dark Green)

Decoration: Underline

Icon Actions (Eye, Trash):

Color: #D4AF6A (Gold)

FORM INPUTS (Filter Bar)
Background color: Transparent

Border color: #D4AF6A (Gold)

Border color on focus: #1E4D3B (Dark Green - implied)

Padding: 8px 12px

Border radius: 6px

Placeholder text color: #5D5D5D

CARDS (Table Container)
Background: #FAF8F2

Border: 1px solid #D4AF6A

Shadow: 0 2px 4px rgba(0,0,0,0.05)

Padding: 0 (Table fills card)

NAVIGATION/HEADER (Page Header)
Height: Auto

Background: Transparent

Content: Title "Round History", Subtitle "24 rounds total", Action Button "New Round".

TABLES
Header row background: #1E4D3B (Dark Green)

Header text color: #D4AF6A (Gold)

Row background:

Odd rows: #FAF8F2 (Cream)

Even rows: #F5F1E8 (Darker Cream/Beige) - Alternating stripes visible

Border/divider style: 1px solid #D4AF6A (Gold) horizontal dividers.

Cell padding: 16px 24px

BADGES/PILLS
Status Pills:

Completed: Bg #C8E6C9 (Pale Green), Text #1E4D3B (Dark Green), Border 1px solid #1E4D3B.

In Progress: Bg #FFE082 (Pale Gold), Text #5D4037 (Brown), Border 1px solid #D4AF6A.

Score Badge:

+6 / +3: Gold rounded square (#D4AF6A bg, White text).

ICONS
Size: 20px (Action icons), 24px (Avatars)

Color: #D4AF6A (Gold) for UI icons (Trash, Eye, Search, Calendar).

Style: Outline

DECORATIVE ELEMENTS
Accent lines/borders: Gold border around the entire table container. Gold horizontal lines separating rows.

Textures: Subtle paper grain on background.

SPECIFIC COMPONENT NOTES
Tee Indicator: Small colored circle (Gold, White, Blue) next to tee name.

Player Avatars: Overlapping circles with initials (JT, RS, MR).

LAYOUT STRUCTURE
Layout: Vertical Stack.

Row 1: Header (Title Left, Button Right).

Row 2: Filter Bar (Full width card with inputs).

Row 3: Data Table (Full width card).

Row 4: Pagination Footer (Left text, Right buttons).

COMPONENT INVENTORY
Filter Bar
Purpose: Allows user to search and filter the list of rounds. Layout:

Container type: Flex

Direction: Row

Alignment: Center vertically, gap 16px.

Dimensions: Full width. Visual Styling:

Background: #FDFBF7 (Light Cream)

Border: 1px solid #D4AF6A (Gold)

Padding: 16px Child Elements:

Search Input: Icon left, placeholder text.

Status Dropdown: "All, In Progress..."

Course Dropdown.

Date Pickers: From / To.

Clear Link: Text button.

Rounds Data Table
Purpose: Displays detailed list of past golf rounds. Layout:

Container type: Table

Dimensions: Full width. Visual Styling:

Header: Dark Green bg, Gold text.

Rows: Alternating Cream/Beige.

Borders: Gold dividers. Child Elements:

Date Column: Text.

Course Column: Name (Bold) + Location (Regular).

Tees Column: Dot + Text.

Score Column: "78 / 72" + Colored badge.

Players Column: Avatar stack.

Status Column: Pill.

Actions Column: Eye and Trash icons.

Pagination Footer
Purpose: Navigate through pages of rounds. Layout:

Container type: Flex

Direction: Row

Alignment: Space between. Visual Styling:

Background: Transparent. Typography within:

Info Text: "Showing 1-15 of 24 rounds" (Inter, 14px). Child Elements:

Page Buttons: Square buttons, Gold border. Active state is filled Gold.