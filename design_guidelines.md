# Design Guidelines: Hotel Check-In Platform with Opera Cloud PMS Integration

## Design Approach: Material Design System

**Justification:** This enterprise productivity application requires efficient data display, clear hierarchy, and professional aesthetics. Material Design provides robust components for dashboards, data tables, and forms while maintaining consistency across desktop, tablet, and mobile devices.

**Key Design Principles:**
- Clear visual hierarchy for role-based interfaces (Admin vs Hotel Staff vs Guests)
- Immediate status recognition through color-coded indicators
- Professional, trustworthy aesthetics suitable for hospitality industry
- Efficient data scanning and task completion

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 210 85% 45% (Professional blue - trust and reliability)
- Primary Variant: 210 85% 35% (Darker blue for headers)
- Secondary: 160 70% 45% (Teal - success states, completed check-ins)
- Error/Pending: 0 75% 55% (Red for pending status)
- Success: 160 70% 45% (Green for completed status)
- Surface: 0 0% 98% (Light gray background)
- Background: 0 0% 100% (White)
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 45%

**Dark Mode:**
- Primary: 210 85% 60%
- Primary Variant: 210 85% 50%
- Secondary: 160 70% 55%
- Error/Pending: 0 70% 60%
- Success: 160 65% 50%
- Surface: 220 15% 15%
- Background: 220 15% 10%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

### B. Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - Clean, professional, excellent readability
- Monospace: JetBrains Mono - For reservation numbers, dates, codes

**Type Scale:**
- Hero/Page Titles: text-4xl font-bold (Admin Dashboard, Hotel Name)
- Section Headers: text-2xl font-semibold (Today's Arrivals, Guest Information)
- Card Titles: text-lg font-semibold
- Body Text: text-base font-normal
- Helper Text: text-sm font-normal text-secondary
- Data Labels: text-xs font-medium uppercase tracking-wide

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 8, 12, and 16 for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section margins: mb-8, mb-12
- Card spacing: gap-4, gap-6
- Dashboard grid gaps: gap-6, gap-8

**Container Structure:**
- Admin/Hotel Dashboards: max-w-7xl mx-auto px-4
- Guest Form: max-w-2xl mx-auto px-4
- Data tables: Full width with horizontal scroll on mobile

### D. Component Library

**Navigation:**
- Top navbar with hotel/admin branding, user profile, role indicator
- Sidebar navigation for admin (Hotels, Settings, Analytics)
- Breadcrumbs for hotel dashboard (Dashboard > Arrivals > Guest Details)

**Data Display:**
- Data tables with alternating row colors, hover states, sortable columns
- Status badges: Rounded pills with icon + text (✅ Completed, ❌ Pending)
- Stat cards: Large numbers with labels and trend indicators
- Timeline view for guest journey (Arrival → Check-in → Room Assignment)

**Forms:**
- Material-style floating labels for inputs
- Clear field grouping with subtle borders
- Inline validation with icon indicators
- Signature pad: Canvas with dotted border, clear button, preview area
- Submit buttons: Full-width on mobile, right-aligned on desktop

**Cards & Containers:**
- Elevated cards with shadow-md for dashboard widgets
- Guest cards: Avatar/initials, name, reservation details, action buttons
- Hotel cards (admin): Logo, name, status, connection indicator, manage button

**Interactive Elements:**
- Primary CTAs: Solid background, white text (Send to Tablet, Submit Check-in)
- Secondary actions: Outlined buttons (View Details, Download)
- Icon buttons: For quick actions (edit, delete, refresh)
- Loading states: Skeleton screens for data tables, spinner for buttons

**Modals & Overlays:**
- Hotel configuration modal (admin): Full-form with tabs for API, settings
- Confirmation dialogs: Centered, max-w-md, with clear action buttons
- Toast notifications: Top-right corner for success/error messages

### E. Responsive Behavior

**Desktop (lg: and above):**
- Three-column admin dashboard (stats, recent activity, hotels list)
- Two-column hotel dashboard (arrivals table, quick actions sidebar)
- Single-column guest form with optimal reading width

**Tablet (md:):**
- Two-column layouts collapse to single with side-by-side cards
- Data tables show essential columns, hide secondary info
- Signature pad optimized for touch input

**Mobile (base):**
- Stack all columns vertically
- Transform tables into card-based list view
- Sticky headers for context while scrolling
- Bottom navigation for hotel dashboard tabs

---

## Interface-Specific Guidelines

### Admin Dashboard
- KPI cards at top: Total Hotels, Active Check-ins Today, Total Guests (Month)
- Searchable/filterable hotels table with connection status indicators
- Quick actions: Add Hotel (prominent), Export Data, View Analytics
- Activity feed sidebar showing recent hotel additions and check-ins

### Hotel Dashboard
- Today's arrivals: Prominent table with guest name, reservation #, room, status
- Quick filters: All, Pending, Completed
- Bulk actions: Send email reminders, export daily report
- "Send to Tablet" button per guest row with loading state
- Real-time status updates via subtle badge animations

### Guest Express Check-in Form
- Progress indicator at top (Step 1 of 1 / Information Complete)
- Auto-filled fields from Opera Cloud with edit capability
- Signature section: Clear instructions, large canvas, undo/clear options
- Review step: Summary of all entered data before final submission
- Success confirmation: Check icon, message, automatic redirect countdown

---

## Images & Visual Assets

**Admin Dashboard:**
- No hero image needed - focus on data and functionality
- Hotel logos displayed in cards (150x150 container)
- Empty state illustration when no hotels added

**Hotel Dashboard:**
- Optional subtle header image: Professional hotel lobby/reception (16:9 aspect ratio, muted overlay)
- Guest placeholder avatars: Initials in colored circles
- Empty state: Illustration of calendar with "No arrivals today"

**Guest Check-in Form:**
- Small hotel logo at top (120x80)
- No distracting hero image - maintain focus on form completion
- Signature pad: White/dark surface with dotted border guidelines
- Success screen: Animated checkmark icon, hotel branding

---

## Animation Strategy

Minimal, purposeful animations only:
- Status badge color transitions on update (300ms ease)
- Button loading spinners
- Modal/dialog fade in (200ms)
- Table row hover lift (subtle shadow increase)
- Toast notification slide-in from top-right
- Signature stroke rendering (real-time canvas)

**Avoid:** Page transitions, scroll animations, decorative motion - maintain professional, snappy feel