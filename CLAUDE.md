# RallyUp — CLAUDE.md

## What This Is

RallyUp is a free, community-driven mobile app that connects underserved NYC youth (ages 8-17) with verified local volunteer sports coaches. Built for the **JA Social Innovation Challenge 2026** — we are **finalists presenting at Boston University**.

**Team:** Justin Zhong, Asher Cole, Kristina Ma, Amelia Korbas
**Tagline:** "Every Kid Deserves A Coach."

---

## Mission

Empower disadvantaged youth by connecting them with volunteer coaches who dedicate their time to making sports accessible — regardless of income or location. RallyUp delivers what no paid app or AI platform can replicate: real human mentorship at zero cost.

---

## Stack

- **Framework:** React Native (JavaScript, not TypeScript)
- **Tooling:** Expo SDK 54, Expo Go for development
- **Icons:** lucide-react-native
- **Safe Area:** react-native-safe-area-context (NEVER use SafeAreaView from react-native directly)
- **Navigation:** @react-navigation/bottom-tabs
- **Maps:** react-native-maps (conditional import — app must work on web/offline without it)
- **State:** React Context API (RallyContext.js is the single global state provider)
- **Target Platforms:** iOS (primary demo device: iPad via Expo Go), Android, web fallback

---

## Architecture

```
App.js                          → SafeAreaProvider → RallyProvider → MainAppFlow
├── AuthScreen.js               → 3-step onboarding wizard (splash → role → details)
└── Tab.Navigator
    ├── Dashboard.js            → Bento grid: profile card, safety card, session list / coach approval queue
    ├── MapScreen.js            → react-native-maps + offline blueprint fallback + session detail panel
    ├── InboxScreen.js          → Split-view encrypted messaging (sidebar + chat, mobile back nav)
    └── ProfileScreen.js        → Credentials, metrics, coach academy, presentation controller
```

**State flows through RallyContext.js exclusively.** No local state should duplicate what's in context. Screens read from context and dispatch actions back to it.

---

## Design System

### Colors (Dark Theme — mandatory)
- **Background:** `#000000`
- **Card/Surface:** `#1C1C1E`
- **Border/Divider:** `#2C2C2E`
- **Primary Accent:** `#FF9500` (orange — buttons, highlights, branding)
- **Safety Green:** `#34C759` (verified status, check-ins, safe indicators)
- **Info Blue:** `#0A84FF` (links, secondary actions, certify buttons)
- **Danger Red:** `#FF3B30` (panic button, errors, decline actions)
- **Text Primary:** `#FFFFFF`
- **Text Secondary:** `#8E8E93`
- **Text Tertiary:** `#AEAEB2`
- **Safety Cell Background:** `#131C15` with border `rgba(52, 199, 89, 0.2)`

### Typography
- Headers: fontSize 24-48, fontWeight '800' or '900', letterSpacing -0.5 to -1
- Section labels: fontSize 12, fontWeight '700', textTransform 'uppercase', letterSpacing 0.5
- Body: fontSize 14-15, color '#E5E5EA'
- Badges/pills: fontSize 11-12, fontWeight '600'-'700'

### Component Patterns
- Cards: backgroundColor '#1C1C1E', borderRadius 16, borderWidth 1, borderColor '#2C2C2E', padding 16
- Buttons (primary): backgroundColor '#FF9500', borderRadius 14, paddingVertical 18
- Buttons (action): borderRadius 8, paddingHorizontal 12, paddingVertical 8
- Pills/chips: borderRadius 12-20, paddingHorizontal 12-16, paddingVertical 6-12
- Circle buttons: width/height 40, borderRadius 20

---

## Core Product Features

### 1. Two User Roles: Student and Coach
- Students browse sessions, join groups, request equipment, GPS check-in
- Coaches manage approval queue, complete academy modules, lead anchor sessions
- The ProfileScreen contains a **Presentation Controller** to switch personas during live demo — this is intentional, not a bug

### 2. Safe-Zone System (SAFETY IS THE #1 PRIORITY)
- All sessions happen at **institutional partner sites only** (NYC DYCD, NYCHA, local schools)
- Sessions are "Permit Blocks" — e.g., "Tuesday 4:00 PM - 6:00 PM at Court 4"
- **Parent/guardian must be physically present** — session cannot start until both coach and parent GPS check in
- GPS coordinate matching verifies physical presence at the safe zone
- Panic button on Dashboard broadcasts location to guardians and site administrators
- All coaches undergo background checks (third-party verified)
- Sessions are NEVER at private residences

### 3. Coach Academy (Onboarding Gate)
- 4 mandatory modules: NYC Safe-Zone Protocol, De-escalation & Mentorship, Youth Sports First Aid, Community Impact Strategy
- Coaches must complete all modules before they can lead sessions
- Each module awards XP toward rank progression
- **Academy is ONLY visible to coach role** — students never see it

### 4. Coach Tier System
- 0-10 hours: "Trained" (🎓, gray)
- 10-50 hours: "Veteran" (🔥, orange)
- 50+ hours: "Master/Pro" (👑, green)

### 5. Anchor Sessions
- Coaches or partners post scheduled sessions at safe zones
- Students browse and join based on sport, skill level, location
- Cohort size: 4-8 students per session for quality attention
- If full → **waitlist** (signals RallyUp to recruit more coaches in that area)

### 6. Equipment On-Site
- Basic gear provided at partner sites (sport-specific: balls, shin guards, cleats, knee pads)
- Students can request equipment when booking a session
- Equipment requests visible to coaches in approval queue

### 7. Parent Rating System
- After each session, parent/guardian rates the coach
- Quick questionnaire on coaching quality
- Feeds into coach profile and tier progression

### 8. Encrypted Messaging
- In-app communication between coaches and students
- Split-view on tablet, stacked with back navigation on mobile
- E2E encrypted (indicated in UI)

---

## Data Model (RallyContext.js)

### Session Object
```javascript
{
  id, sport, title, coachName, coachId, tier, rating, hoursDonated,
  time, date, location, borough, attendees, maxCapacity, status,
  isUserEnrolled,     // boolean — set to true when user joins
  zoneVerified,       // boolean — set to true after GPS check-in
  equipmentAvailable, // string[] — gear available at this site
  coordinates,        // { latitude, longitude }
}
```

### User Profile
```javascript
{
  name, borough, sport, skillLevel,
  hoursContributed, rankScore, parentConnected
}
```

### Pending Request (Coach View)
```javascript
{
  id, studentName, sport, level, time, location,
  equipmentRequested  // string[] — gear the student needs
}
```

### Context Actions
- `joinRallySession(sessionId, equipmentNeeded[])` — reserves spot + optional equipment
- `verifySafeZoneArrival(sessionId)` — GPS check-in, updates session AND profile
- `connectParentDashboard()` — links guardian
- `handlePendingRequest(requestId, 'accept'|'decline')` — coach approves/declines
- `completeAcademyModule(moduleId)` — marks module done, awards XP
- `triggerPanicButton()` — emergency alert to all guardians
- `joinWaitlist(sessionId)` — adds to waitlist for full sessions
- `EQUIPMENT_OPTIONS` — exported constant mapping sport → available gear

---

## Known Constraints

- This is a **demo/MVP** — no backend, no real authentication, no real GPS. All data is seed data in RallyContext.
- The app must be **100% crash-free** during a live pitch. Every button must work. Every screen must render.
- react-native-maps may not be installed — MapScreen must gracefully fallback to offline blueprint mode
- seedData.js exists but is **orphaned dead code** — do not import it. All seed data lives in RallyContext.js.
- Weather widget on Dashboard is hardcoded demo data (68°F, Rain)

---

## Code Quality Rules

1. **NEVER use SafeAreaView from react-native** — always use useSafeAreaInsets from react-native-safe-area-context
2. **Every function destructured from useRally() must exist in RallyContext** — missing functions cause hard crashes
3. **Every field read from session/request objects must exist in the seed data** — undefined field reads cause silent bugs
4. **Alert must be imported from react-native in any file that calls Alert.alert()**
5. **Sport filters must be dynamic** — built from session data, never hardcoded (new sports auto-appear)
6. **Sport emoji must use a lookup map**, not ternary chains that default wrong emoji to unknown sports
7. **Footer/sticky elements must account for tab bar height** — use `bottom: insets.bottom + 70` not just `insets.bottom`
8. **InboxScreen mobile must default activeThreadId to null** — so thread list shows first, not locked into a chat
9. **MapScreen detail panel needs maxHeight on mobile** — never cover entire screen

---

## Current Priority

**Make this app pitch-perfect for the Boston University finalist demo.**

Priority order:
1. Zero crashes, zero errors — every interaction works
2. UI/UX polish — the app should feel professional and intentional, not like an AI prototype
3. Missing organizer features — parent check-in flow, post-session rating modal
4. Visual consistency — spacing, typography, color usage should be cohesive across all screens

---

## Target Audience for the Demo

**Judges** at the JA Social Innovation Challenge. They will:
- Tap through the onboarding flow
- Browse sessions as a student
- Try to join a session (expect equipment prompt)
- Switch to coach view (via ProfileScreen presentation controller)
- Check the map
- Send a test message
- Tap the panic button (it should work, not crash)

Everything must survive curious judges tapping random buttons.

---

## Revenue Model (for context, not for code)

- Sponsorships from sports brands
- Donations from parents/community
- Premium features (progress tracking, video libraries)
- Event hosting (tournaments, clinics)
- Targeted advertising (sports-relevant only)

Year 1 target: 125-250 athletes, 15-30 coaches, $2K-$5K revenue, NYC pilot borough.

---

## Partners & Institutional Context

- **NYC DYCD** (Department of Youth and Community Development) — provides access to safe-zone sites
- **NYCHA** — public housing recreation spaces
- **Junior Achievement** — institutional credibility, competition sponsor
- **Local charter schools** — recruitment pipeline for both coaches and students
- **American Red Cross** — coach first aid/CPR certification
