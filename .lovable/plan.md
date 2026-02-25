

# Opinion Detail Page — Implementation Plan

## Overview

Create a new `/opinion/:id` route that displays the full detail view when any opinion card in the feed is clicked. The page includes staking mechanics, a return calculator, live countdown timer, activity feed, comment section, share functionality, and a resolution panel for closed opinions.

## Files to Create

### 1. `src/pages/OpinionDetail.tsx`
The main detail page component (~500 lines). Structured as follows:

**State & Data:**
- Parse `:id` from URL params, look up the matching card from `sampleCards`
- Local state for: stake input, selected side (yes/no), comment input, countdown timer
- `useEffect` with `setInterval` for live countdown (parse `timeLeft` string into seconds, tick down every 1s)
- Fake activity feed data (5 recent stakes) and fake comments data hardcoded in-file
- A boolean `isResolved` flag on at least one sample card to demonstrate the resolution panel

**Sections (each wrapped in `motion.div` with staggered fade-up):**

1. **Back arrow + Genre tag** — `ArrowLeft` icon from Lucide, links back to `/`. Genre pill in gold.

2. **Question headline** — `font-headline` H1, large text. Creator chip below with 32px avatar circle, username, "Posted X days ago" muted text.

3. **Staking section** — 16px tall yes/no bars animating width on mount (800ms). Large 32px bold percentages. Gold coin total below in Instrument Serif. Staker count and early entry pill.

4. **Return calculator** — Coin input with gold focus border. Live output: `Stake X on Yes → potential win Y` using simple formula `Y = X * (100 / yesPercent)`. Output in gold Instrument Serif Bold.

5. **Buy Yes / Buy No buttons** — Full width side by side, solid green/blue fills, white text, scale 1.02 on hover via Framer Motion.

6. **Countdown timer** — 4 boxes (days, hours, minutes, seconds) with bg-secondary, Instrument Serif Bold 28px numbers, muted labels. Live ticking via `useEffect`. "Resolved by: Community Vote" label below.

7. **Activity feed** — "Recent Stakes" label. 5 rows with avatar, username, "staked Yes/No" colored text, coin amount in gold, timestamp. "View all activity" gold link at bottom.

8. **Share button** — Outlined gold button with `Share2` icon and "Share this call" text. Shows a toast on click.

9. **Comment section** — "The Conversation" in Instrument Serif H3. Input with avatar + gold-bordered field + send button. 3-4 hardcoded comments with gold left border, like/reply actions.

10. **Resolution panel** — Conditionally rendered when `isResolved` is true. Replaces calculator and buy buttons. Gold background panel showing winner, pool distribution, Callit cut. User win/loss state.

### 2. `src/data/sampleCards.ts` (modify)
- Add optional fields to `OpinionCardData`: `postedDaysAgo?: number`, `stakerCount?: number`, `isResolved?: boolean`, `winner?: "yes" | "no"`
- Add `postedDaysAgo` and `stakerCount` values to existing cards

### 3. `src/components/OpinionCard.tsx` (modify)
- Wrap the card in a `Link` (or use `useNavigate` + `onClick`) to navigate to `/opinion/${data.id}`
- Add `cursor-pointer` class

### 4. `src/App.tsx` (modify)
- Add route: `<Route path="/opinion/:id" element={<OpinionDetail />} />`
- Import `OpinionDetail`

## Technical Details

**Countdown timer logic:**
- Parse the `timeLeft` string (e.g. "3 days left") into total seconds on mount
- `useEffect` with 1-second interval to decrement
- Convert remaining seconds to `{ days, hours, minutes, seconds }` for display
- Clear interval on unmount or when reaching 0

**Return calculator formula:**
- Simple proportional: `potentialWin = stakeAmount * (100 / selectedPercent) - stakeAmount`
- Updates live as user types via controlled input

**Activity feed data (hardcoded):**
```text
5 entries with: username, side (yes/no), amount, timestamp
e.g. "cryptobro staked Yes · 120 coins · 2 min ago"
```

**Comment data (hardcoded):**
```text
3-4 comments with: username, avatar initial, text, timestamp
```

**Resolution panel conditional:**
- If card has `isResolved: true`, hide calculator + buy buttons, show resolution panel instead
- One sample card (e.g. id 2, Kendrick question) marked as resolved for demo

**Animations:**
- Page entrance: `motion.div` fade up 400ms
- Each section: staggered by 100ms using `custom` index on variants (same pattern as CallIt page)
- Percentage bars: `motion.div` width animation 800ms on mount
- Buy button hover: `whileHover={{ scale: 1.02 }}` via Framer Motion
- Timer: CSS transitions on number changes

## Routing & Navigation Flow

```text
Feed (/) → Click card → /opinion/:id (detail page)
Detail page → Back arrow → / (feed)
Detail page → Logo in navbar → / (feed)
```

