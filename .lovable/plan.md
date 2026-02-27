

# Portfolio Page Implementation

## Files to Create/Modify

### 1. Create `src/pages/Portfolio.tsx`
New page with the following structure:

**Header:** "Your Calls" H1 in Instrument Serif + muted subtext.

**Performance Strip:** 4 stat cards in a responsive grid (2x2 on mobile, 4x1 on desktop). Each card has `bg-card border border-[#B8860B] rounded-xl p-5` with gold numbers using `font-headline`.

Hardcoded demo stats:
- Total Coins: 2,500
- Position Value: 1,240
- Win Rate: 68%
- Biggest Win: 840

**Tabs:** Using a custom tab bar with gold underline (same `motion.div layoutId` pattern as GenreTabs). Three tabs: Active Calls, Call History, Performance.

**Tab 1 — Active Calls:**
Filter `sampleCards` for `status === "open" || status === "locked"`. Each card shows question, called side (hardcoded "Yes"/"No"), coins called, status pill, projected return via `calculateNetWin`, crowd context label, time remaining. Cards use `card-gold` class with click → navigate to `/opinion/:id`. Empty state with "Call It" CTA.

**Tab 2 — Call History:**
Filter for resolved/draw cards. Show result badge: won (green +X), lost (muted "0 returned"), draw (blue "Refunded"). Filter pills (All/Won/Lost/Draw/Voided) with gold fill on selected.

**Tab 3 — Performance:**
Large 48px gold win rate centered. Stats grid below. Recent activity feed — 10 hardcoded entries with gold for wins, muted for losses.

### 2. Modify `src/App.tsx`
Add route: `<Route path="/portfolio" element={<Portfolio />} />`

### 3. Modify `src/components/Navbar.tsx`
Make "Portfolio" link clickable — wrap in `Link to="/portfolio"` or use `onClick={() => navigate("/portfolio")}`.

## Technical Notes
- Reuse `calculateNetWin`, `getCrowdContext` from `src/lib/callit.ts`
- Reuse `sampleCards` data with hardcoded user positions
- Same staggered `motion.div` fade-up animation pattern as other pages
- Same status pill config as OpinionCard (`bg-yes/15 text-yes`, etc.)

