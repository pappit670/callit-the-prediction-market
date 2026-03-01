

# Wallet Page Implementation

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Wallet.tsx` | Create — full wallet page |
| `src/App.tsx` | Add `/wallet` route |
| `src/components/Navbar.tsx` | Make coin balance + Deposit button link to `/wallet`, add Wallet to avatar dropdown or nav |

## `src/pages/Wallet.tsx`

**Balance Card:** Centered dark card (`bg-card border border-[#B8860B] rounded-[20px] p-10`). Gold `Coins` icon top center. "Available Coins" Inter Medium 14px muted. Balance: `font-headline text-[56px] font-bold text-gold` — hardcoded 2,500. Two chips below in a flex row: "In active calls: 1,240" and "Total won: 3,420" — `bg-secondary rounded-full px-4 py-1.5 text-xs`.

**Action Buttons:** Two buttons side by side below balance card. Deposit: gold fill, black text, `rounded-full`. Withdraw: outlined muted border. Both have a "Coming Soon" gold pill tag positioned above. On click either: open a Dialog modal — "Real money deposits coming soon. Enjoy your free coins and keep calling." with a gold "Got it" dismiss button.

**Signup Coin Gift:** A `showGift` state (default false, triggered by a demo button or `useState(true)` for first-time demo). Full-screen dark overlay with coin rain (reuse `CoinParticle` pattern from ResolutionScreen). "You're in." Instrument Serif H1 white. Gold count-up number (500 or 1000). "Make My First Call" full-width gold button navigates to `/call-it`.

**Transaction History:** Below action buttons. Filter pills: All / Called / Won / Lost / Refunded — gold fill on selected. Hardcoded ~10 transaction rows. Each row: left gold icon circle (Trophy for wins, ArrowUp for calls, Star for refunds), center label + timestamp muted 12px, right amount — green `text-yes` for wins, muted for losses, blue `text-no` for refunds. "Load more" outlined gold button centered at bottom.

## `src/App.tsx`

Add: `<Route path="/wallet" element={<Wallet />} />` and import.

## `src/components/Navbar.tsx`

- Wrap the coin balance `div` in a `Link to="/wallet"` so clicking balance navigates to wallet.
- Change the Deposit button to also `Link to="/wallet"`.

## Technical Notes

- Reuse `CoinParticle` and `CountUpNumber` patterns from `ResolutionScreen.tsx` (duplicate locally or extract to shared util).
- Same staggered `motion.div` fade-up animations as Portfolio page.
- Dialog for "Coming Soon" modals uses existing `@radix-ui/react-dialog` components from `src/components/ui/dialog.tsx`.

