

# Layout & Visual Upgrades

## 1. Navbar Restructure — Move Breaking News Inline

**`src/components/Navbar.tsx`**
- Increase height from `h-16` to `h-[68px]`
- After the search bar, add a compact inline breaking news ticker (max-w-[280px]) with red pulse dot + scrolling headline text using the same `animate-ticker` CSS
- Remove Portfolio, Coin balance, and Deposit links to simplify right side
- Final layout: Logo | Search | Inline Ticker | ThemeToggle, Bell, Call It, Avatar

**`src/pages/Index.tsx`**
- Remove `<BreakingNewsTicker />` import and usage from the page

**`src/components/BreakingNewsTicker.tsx`**
- Keep file but repurpose as `NavbarTicker` — or inline the ticker logic directly into Navbar and delete this file

## 2. Mini Line Graph on Each Opinion Card

**`src/components/MiniGraph.tsx`** (new)
- SVG-based component, height 48px, full width
- Takes `yesPercent` and `noPercent` as props
- Generates fake historical data points (8-10 points) using a seeded random walk from ~50% converging to current percentages
- Two smooth cubic bezier paths (green `#22C55E` for Yes, blue `#3B82F6` for No)
- Area fills below each line at 10% opacity
- Right side: current Yes% (green) and No% (blue) stacked vertically, Inter Bold 13px
- Animate line drawing with Framer Motion `pathLength` from 0 to 1 over 600ms

**`src/components/OpinionCard.tsx`**
- Insert `<MiniGraph>` between the question text and the progress bar (after line ~102, before line ~136)

## 3. Floating Comment Bubbles Between Cards

**`src/components/FloatingComments.tsx`** (new)
- Component that renders a single floating comment bubble at a time
- Uses `useState` + `useEffect` with a 4-6s interval to cycle through sample comments
- Framer Motion: `y: [0, -40]`, `opacity: [0, 1, 1, 0]` over 3s
- Pill shape: bg-card, 1px gold border, border-radius 999px, padding 6px 12px
- Contains: 20px avatar circle, username (gold 11px), comment text (11px, max 40 chars)
- Sample comments: "Called it weeks ago 🔥", "No way this happens", "Easy call Yes on this one", etc.

**`src/pages/Index.tsx`**
- In the cards loop, insert `<FloatingComments />` between every 2-3 cards (e.g., after index 1, 3, 5)
- Each instance gets a different delay offset so they stagger

## Files Summary

| File | Action |
|------|--------|
| `src/components/Navbar.tsx` | Add inline ticker, increase height, simplify right side |
| `src/components/BreakingNewsTicker.tsx` | Delete (moved into navbar) |
| `src/components/MiniGraph.tsx` | Create — SVG line graph with animated paths |
| `src/components/FloatingComments.tsx` | Create — floating comment bubbles |
| `src/components/OpinionCard.tsx` | Insert MiniGraph between question and progress bar |
| `src/pages/Index.tsx` | Remove BreakingNewsTicker, add FloatingComments between cards |

