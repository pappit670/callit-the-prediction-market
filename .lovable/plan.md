

# Parimutuel Pool System & UX Upgrade

## Overview

This upgrade introduces a proper parimutuel payout model, anti-manipulation safeguards, crowd context labels, refined language ("Call Yes / Call No"), and several new UX elements across the card, detail page, calculator, and creation flow.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/OpinionCard.tsx` | Language to "Call Yes/No", crowd context labels, net result display, minimum 10 coins, whale cap indicator, void warning, pool pulse class |
| `src/data/sampleCards.ts` | Add `callerCount` field to all cards, ensure data supports void/whale scenarios |
| `src/pages/OpinionDetail.tsx` | Language updates, net result calculator, crowd context section, whale cap notice, void warning, early caller badge, minimum 10 coin enforcement, pool pulse animation |
| `src/pages/CallIt.tsx` | Minimum 10 coins, language to "Call Yes/No", whale cap mention |
| `src/components/ResolutionScreen.tsx` | Net result (not total payout), calm loss handling, void/refund state |
| `src/index.css` | Pool pulse keyframe animation |
| `tailwind.config.ts` | Pool pulse animation entry |

---

## Detailed Changes

### 1. Language — "Call Yes / Call No" Throughout

Replace across all files:
- "Stake Yes" → "Call Yes"
- "Stake No" → "Call No"
- "staked Yes/No" → "called Yes/No" (activity feed)
- "people have staked" → "people have called"
- "Coins are deducted immediately on stake" → "Coins are committed when you call"
- "Stake your belief" language in subtext
- "You're staking X coins" → "You're calling X coins"
- Keep "stake" only when referring to the coin amount itself (e.g., "Your call: 200 coins on Yes")

### 2. Net Result Display (Not Total Payout)

**Current:** Calculator shows total payout including original stake.
**New:** Show net profit only.

Formula change in OpinionDetail calculator output:
- Current: `potentialWin = stakeAmount * (100 / percent) * 0.9 - stakeAmount`
- This is already net. Rename the label to be explicit:
  - "Call 100 on Yes → net win **140** coins" (green text for positive)
  - On card: "Call 100 → net win **140**" (not "potential win")

In ResolutionScreen:
- Win: "+X coins" should show net profit (payout minus original stake)
- Loss: show "X coins lost" (already correct)

### 3. Crowd Context Labels

Add a contextual label on every card and detail page based on the vote split:

Logic (add as a utility function):
```
if (yesPercent >= 75 || noPercent >= 75) → "High Confidence" (bold color of leading side)
if (Math.abs(yesPercent - noPercent) <= 10) → "Balanced" (muted grey)
if (yesPercent <= 25 || noPercent <= 25) → "Contrarian Opportunity" (gold)
else → "Leaning [Yes/No]" (lighter shade of leading side)
```

**On OpinionCard:** Small pill below the "Weighted by coins staked" label.
**On OpinionDetail:** Larger label next to the percentage display.

### 4. Minimum Call Amount — 10 Coins

**CallIt page:** Change `min` on input from 0 to 10. Validation: `Number(stake) >= 10` in `isReady` check. Show helper text: "Minimum call: 10 coins".

**OpinionDetail calculator:** Set `min="10"` on the coin input. Show validation message if under 10.

### 5. Whale Manipulation Cap — 20% of Pool Max

**OpinionDetail:** Below the coin input, show a notice:
"Max call: **[20% of pool]** coins (20% cap to keep it fair)"
Inter Regular 12px, muted grey, with an info icon.

Enforce in UI: if `stakeAmount > pool * 0.2`, show a warning and disable the Call buttons. For the detail page, calculate `maxCall = Math.floor(coins * 0.2)`.

**On cards:** No change needed (cards don't have input).

### 6. Void Under 10 Callers — Full Refund

**Data model:** Rename `stakerCount` to `callerCount` in `OpinionCardData` interface (or add `callerCount` as alias). Update sample data.

**On OpinionCard:** If `callerCount < 10` and status is open, show a small warning pill:
"Needs X more callers to be valid" in muted orange/gold, 10px.

**On OpinionDetail:** Show an info box:
"This call needs at least 10 callers to resolve. Under 10 = void and full refund."
Inter Regular 12px, muted, with info icon.

**In ResolutionScreen:** Add a void state alongside win/loss/draw:
If callerCount < 10 at resolution → show "Void — Not enough callers. Full refund." in muted panel.

### 7. Single Wallet / Verified ID Notice

**OpinionDetail:** Small text below the Call buttons:
"One wallet per verified account. Duplicate accounts are banned."
Inter Regular 10px, muted grey.

### 8. Projected Return Live Calculator Updates

Already exists but needs refinement:
- Show the early entry multiplier in the calculation: `netWin = stakeAmount * (100 / percent) * 0.9 * multiplier - stakeAmount`
- Display: "Call X on Yes → net win **Y** coins (1.5x early bonus)" with the multiplier in a gold badge
- The multiplier badge: `rounded-full bg-gold/10 px-2 py-0.5 text-[11px] text-gold`

### 9. Pool Pulse Animation

**New CSS keyframe** in `src/index.css`:
```css
@keyframes pool-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); opacity: 0.85; }
}
.animate-pool-pulse {
  animation: pool-pulse 1.5s ease-in-out;
}
```

**On OpinionCard:** Add `animate-pool-pulse` class to the coin count element. Since there's no real-time data, apply it on mount with a slight delay for visual effect.

**On OpinionDetail:** Same pulse on the large gold coin total.

### 10. Early Caller Gold Pill Badge

**On OpinionDetail activity feed:** For the first 2-3 entries in the activity feed (simulating early callers), add a gold pill badge: "Early Caller" in `bg-gold/10 text-gold text-[10px] rounded-full px-2 py-0.5`.

**On OpinionCard:** Not shown (too crowded).

### 11. Loss Handling — Calm, Non-Punitive

**ResolutionScreen loss state** is already calm ("Tough call."). Refine:
- Change "X coins lost" to "X coins committed to this call"
- Add: "Every call sharpens your instinct." Inter Regular 13px muted grey, below the amount
- Keep "Make another call" CTA

### 12. Minimum Win Floor +3%

In the return calculator, enforce a minimum net return of 3% on any winning call:
```
rawNet = stakeAmount * (100 / percent) * 0.9 * multiplier - stakeAmount
minNet = stakeAmount * 0.03
netWin = Math.max(rawNet, minNet)
```

Display: if the minimum floor kicks in, show "(+3% minimum guaranteed)" in muted text next to the result.

---

## Technical Notes

**Payout formula (complete):**
```
earlyMultiplier = getEarlyEntryMultiplier(...)
rawReturn = stakeAmount * (100 / sidePercent) * 0.9 * earlyMultiplier
rawNet = rawReturn - stakeAmount
minNet = stakeAmount * 0.03
netWin = Math.max(rawNet, minNet)
```

**Crowd context function:**
```typescript
function getCrowdContext(yesPercent: number, noPercent: number): { label: string; classes: string } {
  const diff = Math.abs(yesPercent - noPercent);
  if (yesPercent >= 75 || noPercent >= 75) return { label: "High Confidence", classes: "text-yes font-semibold" or "text-no" };
  if (diff <= 10) return { label: "Balanced", classes: "text-muted-foreground" };
  if (yesPercent <= 25 || noPercent <= 25) return { label: "Contrarian Opportunity", classes: "text-gold" };
  return { label: `Leaning ${yesPercent > noPercent ? "Yes" : "No"}`, classes: yesPercent > noPercent ? "text-yes/70" : "text-no/70" };
}
```

**Whale cap:** `maxCall = Math.floor(coins * 0.2)` — enforce client-side only for now.

**callerCount vs stakerCount:** Update the interface to use `callerCount`. Keep `stakerCount` as optional alias for backward compat, map it in sample data.

