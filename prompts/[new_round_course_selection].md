[new_round_course_selection]

COLOR PALETTE
Primary color (main brand color): #1E4D3B (Deep Hunter Green)

Secondary color: #D4AF6A (Champagne Gold/Antique Brass)

Accent color: #D4AF6A (Used for progress steps and selected state borders)

Background colors:

Page background: #FAF8F2 (Cream/Ivory)

Card/surface background: #FDFBF7 (Lighter Cream)

Header/navbar background: #FDFBF7 (Implied, clean header)

Text colors:

Primary text: #1C1C1C (Charcoal Black)

Secondary/muted text: #5D5D5D (Dark Gray - location, step counter)

Link text: #1E4D3B (Back link)

State colors:

Selected Item: #EAE4D6 (Beige highlight for selected course)

Border colors: #D4AF6A (Gold - active items), #E0D8C8 (Light Beige - inactive items)

TYPOGRAPHY
Heading font family: "Playfair Display", serif

Body font family: "Inter", sans-serif

Font sizes:

Page title (h1): 32px ("Start New Round")

Section headers (h2): 24px ("Select Course")

Body text: 16px (Course names)

Small/caption text: 14px (Locations, "18 holes", Step counter)

Font weights used:

400 (Body text)

500 (Medium buttons)

600 (Selected items)

Line heights: 1.5 (Standard)

Letter spacing if notable: Normal

SPACING & LAYOUT
Page max-width: 800px (Restricted width for focused wizard flow)

Page padding/margins: Top: 80px; Side Margins: Auto (Centered)

Card padding: 40px

Gap between cards/sections: 24px

Grid columns: Single column stack.

Standard spacing scale: 8px, 16px, 24px, 32px, 40px

BORDERS & CORNERS
Border radius:

Main Wizard Card: 12px

Course List Items: 8px

Buttons: 6px

Inputs: 6px

Border widths: 1px (Standard), 2px (Selected state)

Border styles: Solid, Double (Card perimeter)

SHADOWS
Card shadows: 0 8px 24px rgba(0,0,0,0.08) (Prominent shadow for floating wizard card)

Elevated elements: Wizard Card

Hover state shadows: 0 2px 4px rgba(0,0,0,0.05) (On list items)

BUTTONS
Primary button ("Continue"):

Background: #1E4D3B (Hunter Green)

Text color: #FFFFFF (White)

Padding: 12px 32px

Border radius: 6px

Font weight: 500

Secondary button ("Previous"):

Background: #FAF8F2 (Cream)

Text color: #D4AF6A (Gold)

Border: 1px solid #D4AF6A

Padding: 12px 32px

FORM INPUTS
Background color: #FFFFFF (White)

Border color: #D4AF6A (Gold)

Padding: 10px 16px

Border radius: 6px

Placeholder text color: #9E9E9E

Toggle Switch: Gold active state.

CARDS (Wizard Container)
Background: #FDFBF7

Border: Double gold border style (Thin outer, padding, thin inner).

Shadow: Deep drop shadow.

Padding: 40px

NAVIGATION/HEADER (Wizard Header)
Height: Auto

Background: Transparent

Content: Centered Title and Subtitle ("Set up your round in a few simple steps"). Left aligned "Back to rounds" link.

BADGES/PILLS
Holes Badge: Simple text label "18 holes", right aligned in list item.

ICONS
Size: 24px (Progress steps), 16px (Search icon)

Color: #D4AF6A (Gold)

Style:

Active Step: Filled Gold Circle.

Inactive Step: Gold Outline Circle.

DECORATIVE ELEMENTS
Progress Bar: Horizontal Gold line connecting step circles.

Textures: Subtle paper grain background.

SPECIFIC COMPONENT NOTES
Progress Steps: 4 steps (Course, Tees, Players, Details). Active step text is Bold Black, inactive is Regular Gray.

Course List Item:

Normal: Beige background #F5F1E8, 1px border.

Selected: Darker Beige background #EAE4D6, 2px Gold border #D4AF6A.

Hover: Cursor pointer.

LAYOUT STRUCTURE
Layout: Centralized Single Column.

Top: Simple Header.

Middle: Main Wizard Card containing Progress Bar -> Search/Filter -> List -> Footer Actions.

COMPONENT INVENTORY
Progress Stepper
Purpose: Indicates current stage in round setup. Layout:

Container type: Flex

Direction: Row

Alignment: Space-between (or distributed). Visual Styling:

Lines: Gold connector lines. Child Elements:

Step Nodes: Circle indicators. Filled for current/past, Outline for future.

Labels: Text below circles.

Course Selection List
Purpose: List of selectable courses. Layout:

Container type: Flex/Stack

Direction: Column

Gap: 12px Visual Styling:

Items: Rounded rectangles. Child Elements:

Course Name: Bold.

Location: Muted text below name.

Meta: "18 holes" aligned right.

Wizard Footer
Purpose: Navigation actions. Layout:

Container type: Flex

Direction: Row

Alignment: Space-between.

Dimensions: Full width of card. Child Elements:

Left: "Previous" button.

Center: "Step 1 of 4" text.

Right: "Continue" button.