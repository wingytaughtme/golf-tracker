[player_profile]
COLOR PALETTE
Primary color (main brand color): #1E4D3B (Deep Hunter Green)

Secondary color: #D4AF6A (Champagne Gold/Antique Brass)

Accent color: #2E7D32 (Success/Birdie Green), #F9A825 (Warning/Bogey Amber), #E65100 (Double Bogey Orange), #C62828 (Triple+ Red)

Background colors:

Page background: #FAF8F2 (Cream/Ivory)

Card/surface background: #FDFBF7 (Lighter Cream/Off-white)

Header/navbar background: #1E4D3B (Deep Hunter Green)

Text colors:

Primary text: #1C1C1C (Near Black/Charcoal)

Secondary/muted text: #5D5D5D (Dark Gray)

Link text: #1E4D3B (Deep Hunter Green, often underlined)

State colors:

Success/positive: #2E7D32 (Green)

Warning: #F9A825 (Amber/Yellow)

Error/negative: #C62828 (Red)

Border colors: #D4AF6A (Gold)

TYPOGRAPHY
Heading font family: "Playfair Display", serif

Body font family: "Inter", sans-serif

Font sizes:

Page title (h1): 36px (e.g., "John Smith")

Section headers (h2): 24px (e.g., "Handicap Trend")

Card titles (h3): 18px (e.g., "Best Round")

Body text: 14px-16px

Small/caption text: 12px (e.g., "GHIN: 1234567")

Data numbers (large): 32px-48px (e.g., "12.4")

Font weights used:

400 (Body text, labels)

500 (Medium emphasis)

600 (Semi-bold for headers, active tabs)

700 (Bold numbers)

Line heights: 1.5 (Standard body), 1.2 (Headings)

Letter spacing if notable: Normal; slightly tighter on large serif headers

SPACING & LAYOUT
Page max-width: 1200px (Centered content container)

Page padding/margins: Top/Bottom: 40px; Left/Right: 24px

Card padding: 24px (Consistent across all cards)

Gap between cards/sections: 24px

Grid columns:

Main layout: 12-column grid system

Top Header Card: 12 columns (Full width)

Stats Row: 4 equal columns (3 columns each)

Charts Row: 2 equal columns (6 columns each)

Bottom Tables: 2 equal columns (6 columns each)

Standard spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 40px

BORDERS & CORNERS
Border radius:

Cards: 8px

Buttons: 4px

Inputs: 4px

Badges/pills: 12px (e.g., "You" badge)

Border widths: 1px (Standard card border), 3px (Card top accent border)

Border styles: Solid

SHADOWS
Card shadows: 0 2px 4px rgba(0,0,0,0.05) (Subtle lift)

Elevated elements: None prominently visible; design is relatively flat with borders providing depth.

Hover state shadows: 0 4px 8px rgba(0,0,0,0.1) (Implied for interactive cards)

BUTTONS
Primary button ("Edit Profile"):

Background: Transparent/Cream #FDFBF7

Text color: #1E4D3B (Dark Green)

Border: 1px solid #D4AF6A (Gold)

Padding: 8px 16px

Border radius: 6px

Font weight: 500

Hover state: Slight background darkening or border darkening.

Secondary button: Not explicitly visible, but typically filled Gold or Green based on palette.

Text/link button ("Back to Players", "View All"):

Background: None

Text color: #1E4D3B (Dark Green) or #5D5D5D (Gray)

Padding: 0

Decoration: Underline on hover or permanent underline depending on context.

CARDS
Background: #FDFBF7 (Lighter Cream)

Border:

Sides/Bottom: 1px solid #E0D8C8 (Light Beige/Gray)

Top: 3px solid #D4AF6A (Gold Accent)

Shadow: 0 2px 4px rgba(0,0,0,0.05)

Padding: 20px-24px

Hover state: Cursor pointer if interactive.

NAVIGATION/HEADER
Height: 64px

Background: #1E4D3B (Deep Hunter Green)

Logo position: Left (Text "Birdie Book" + Icon)

Nav link styling: White/Off-white text (#FFFFFF or #FAF8F2), Sans-serif, 14px.

Active link indicator: Gold underline or bolder text weight.

Right Side: User Avatar Circle (Initials "JS").

TABLES (Recent Rounds, Course Breakdown)
Header row background: #F5F1E8 (Darker Cream/Beige)

Header text color: #1C1C1C (Bold Charcoal)

Row background: #FDFBF7 (Standard Card Bg)

Alternate row background: Not strictly striped, but rows have borders.

Border/divider style: 1px solid #E0D8C8 (Light Beige) between rows.

Cell padding: 12px 16px

Typography: Sans-serif headers and data.

BADGES/PILLS
Border radius: 12px

Padding: 4px 8px

Font size: 12px

Variants:

"You" Badge: Bg #D4AF6A (Gold), Text #1C1C1C (Dark)

Tee Color Indicators: Small colored squares/rectangles (Gold, Black, White) indicating tee box.

ICONS
Size: 24px (Standard UI icons like Trophy, Golf Ball)

Color: #D4AF6A (Gold) outlines or #1C1C1C (Dark) depending on emphasis.

Style: Line/Outline style, thin stroke width (approx 1.5px).

DECORATIVE ELEMENTS
Accent lines/borders: Gold top borders on every card are the primary decorative motif.

Textures: Subtle paper grain texture on the main page background (#FAF8F2).

Dividers: Minimal use of dividers; whitespace and card borders separate content.

LAYOUT STRUCTURE
Overall: Centered container layout.

Header: Full-width fixed or sticky top bar.

Content: Single column stack of rows.

Row 1: Profile Header (Full width)

Row 2: 4 Key Stats Cards (Grid)

Row 3: 2 Large Chart Cards (Grid)

Row 4: 2 Data Table Cards (Grid)

COMPONENT INVENTORY
Profile Header Card
Purpose: Displays primary user information, handicap, and membership details. Layout:

Container type: Flex

Direction: Row

Alignment: Center vertically

Dimensions: Full width of container. Visual Styling:

Background: #FDFBF7

Border: Top 3px Gold #D4AF6A, others 1px Gray #E0D8C8

Padding: 24px Typography within:

Name: Playfair Display, 36px, Bold, #1C1C1C

Handicap: Inter, 48px, Bold, #1E4D3B

Label: Inter, 14px, #D4AF6A (Gold) Child Elements:

Avatar: Large circle (80px), Green bg, Gold text "JS".

Badge: "You" pill next to name.

Meta Row: Text showing rounds played, member since, GHIN.

Action Button: "Edit Profile" on far right.

Stats Summary Cards (Row of 4)
Purpose: Quick view of key performance metrics (Avg Score, Best Round, Fairways, GIR). Layout:

Container type: Flex/Grid item

Direction: Column (Content) or Row (Icon + Text)

Alignment: Left aligned content. Visual Styling:

Background: #FDFBF7

Border: Top 3px Gold, others 1px Gray.

Shadow: Subtle. Typography within:

Label: Inter, 14px, #5D5D5D

Value: Inter, 24px, Bold, #1C1C1C

Subtext: Inter, 12px, #5D5D5D (e.g., "+14.2 vs par") Child Elements:

Icon: Left-aligned, Gold stroke.

Handicap Trend Chart
Purpose: Visualizes handicap index changes over time. Layout: Standard Card layout. Visual Styling: Card styles apply. Child Elements:

Chart: Line chart.

Line: Dark Green #1E4D3B.

Points: Gold filled circles #D4AF6A.

Grid: Light Gray, horizontal and vertical lines.

Axis: Sans-serif, 12px text.

Scoring Distribution Chart
Purpose: Bar chart showing breakdown of scores (Eagle, Birdie, Par, etc.). Layout: Standard Card layout. Child Elements:

Chart: Horizontal Bar Chart.

Colors:

Eagle: Gold #D4AF6A

Birdie: Green #2E7D32

Par: Beige #E0D8C8

Bogey: Light Orange #FFCC80

Double: Dark Orange #E65100

Triple+: Red #C62828

Labels: Left aligned score types, right aligned percentages.

Recent Rounds Table
Purpose: List of last played rounds with summary data. Layout: Card containing a table. Visual Styling:

Header: "Recent Rounds" (Playfair Display, 20px). Link "View All" (Inter, 12px, Underline).

Table Header: Beige background row.

Rows: White/Cream background. Typography within:

Course: Inter, 14px, #1C1C1C.

Score: Inter, 14px, #1C1C1C.

vs Par: Color coded (Green for -, Black for E, Red/Orange for +).

Course Breakdown / Scoring by Par
Purpose: Tabbed or split view showing stats per course and par performance. Layout: Card containing two distinct data tables or lists. Visual Styling: Card styles apply. Typography: Header "Course Breakdown" and "Scoring by Par" (Playfair Display).