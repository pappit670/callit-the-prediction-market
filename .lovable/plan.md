

# Callit Core Logic & UX Upgrade — Implementation Plan

## Overview

This upgrade introduces opinion resolution types, lifecycle states, payout logic with early-entry multipliers, language changes from "Buy" to "Stake", enhanced card/detail displays, and a cinematic resolution screen. All changes stay within the existing design system.

## Scope of Changes

### 1. Data Model Updates — `src/components/OpinionCard.tsx` + `src/data/sampleCards.ts`

Add new fields to `OpinionCardData`:

- `resolutionType: "crowd" | "event" | "metric"` — defaults to `"crowd"`
- `status: "open" | "locked" | "resolved" | "draw"` — defaults to `"open"`

Update sample cards with these fields. Mark card 2 (Kendrick) as `status: "resolved"`, `resolutionType: "crowd"`. Add one card or mark card 5 as `status: "draw"` for demo. All others `"open"`.

### 2. OpinionCard Updates — `src/components/OpinionCard.tsx`

Add below the genre tag:
- **Resolution type pill**: "Crowd Based" or "Event Based" in muted grey background, 11px
- **Status pill**: color-coded — Open (green), Closing (gold), Resolved (muted), Draw (blue)
- **"Weighted by coins staked"** label below percentages, 10px muted grey

Replace button text:
- "Buy Yes" → "Stake Yes"
- "Buy No" → "Stake No"

Add dynamic potential return line:
- "Stake 100 → potential win 240" using the proportional formula, 12px muted text

### 3. OpinionDetail Updates — `src/pages/OpinionDetail.tsx`

**Language changes:**
- "Buy Yes" → "Stake Yes", "Buy No" → "Stake No" (lines 211-215)
- "Coins are deducted immediately on stake" stays

**New elements:**
- Resolution type info box below the question: icon + "How this resolves: The side with the most staked coins when the timer ends wins." for crowd type. Different text for event type.
- Status pill next to genre tag in header
- "Weighted by coins staked" label below percentage bars
- User personal stake display (hardcoded demo): "Your stake: 200 coins on Yes" in gold
- Early entry multiplier logic: display the correct multiplier based on time elapsed

**Payout display updates:**
- Show platform fee breakdown in resolution panel
- Update the resolution panel to reflect the correct status

### 4. CallIt Page Updates — `src/pages/CallIt.tsx`

Add a new **Resolution Type selector** section between the category selector and time limit:
- Label: "How should this resolve?"
- Three options as cards/pills:
  - "Crowd Based" — selected by default, gold fill
  - "Event Based" — selectable
  - "Metric Based" — disabled, "Coming Soon" tag
- Brief description under each option

Update preview card to include the selected resolution type.

### 5. Cinematic Resolution Screen — `src/components/ResolutionScreen.tsx` (new file)

A full-screen overlay component triggered when viewing a resolved opinion:

**Props:** `card data`, `userWon: boolean`, `userPayout: number`, `onDismiss: () => void`

**Layout:**
- Full viewport overlay with dark backdrop
- Large question text in Instrument Serif H1, centered
- Winning side revealed with scale-up animation (500ms): large "Yes" in green or "No" in blue
- Pool breakdown: total pool, Callit cut (10%), distributed amount

**Win state:**
- Gold coin rain using Framer Motion animated particles (10-15 falling coin icons)
- "You called it." in Instrument Serif H1 gold
- Coin amount counting up animation
- "Show the world you called it" share button

**Loss state:**
- Clean muted panel, no harsh visuals
- "Tough call." in Instrument Serif H2
- Amount lost in muted text
- "Make another call" gold outlined CTA

**Dismiss:** "Back to feed" button at bottom

### 6. Integration in OpinionDetail

- When a resolved opinion is opened, show a "View Result" button that triggers the `ResolutionScreen` overlay
- Or auto-show the cinematic screen on first visit to a resolved opinion (with dismiss)

## Files Modified

| File | Action |
|------|--------|
| `src/components/OpinionCard.tsx` | Add resolution type pill, status pill, weighted label, rename Buy→Stake, add potential return |
| `src/data/sampleCards.ts` | Add `resolutionType`, `status` fields to interface and data |
| `src/pages/OpinionDetail.tsx` | Rename Buy→Stake, add resolution info box, status pill, weighted label, user stake display |
| `src/pages/CallIt.tsx` | Add resolution type selector section |
| `src/components/ResolutionScreen.tsx` | New — cinematic full-screen resolution overlay |
| `src/index.css` | Add coin-rain keyframe animation |

## Technical Details

**Payout formula displayed:**
- `potentialWin = stakeAmount * (100 / sidePercent) * 0.9 - stakeAmount`
- The 0.9 accounts for the 10% platform fee

**Early entry multiplier tiers (display only):**
- First 10% of time: 1.5x label
- 10-40%: 1.25x label
- 40-80%: 1.0x (no label)
- Last 20%: 0.85x late penalty label
- Calculated from `postedDaysAgo` vs total duration parsed from `timeLeft`

**Coin rain animation:**
- 12-15 `motion.div` elements with coin icons
- Random x positions, staggered delays, falling from top with rotation
- Duration 2-3s, ease out, opacity fade at bottom

**Status pill colors (Tailwind classes):**
- Open: `bg-yes/15 text-yes`
- Closing: `bg-gold/15 text-gold`
- Resolved: `bg-muted text-muted-foreground`
- Draw: `bg-no/15 text-no`

