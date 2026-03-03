

# Kenya-First Local Feed & Breaking News

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/components/GenreTabs.tsx` | Reorder tabs, Local first with 🇰🇪 emoji |
| `src/components/BreakingNewsTicker.tsx` | Create — scrolling news strip |
| `src/components/OpinionCard.tsx` | Add `cardType` badge support (Breaking / Callit Pick / Community) |
| `src/data/sampleCards.ts` | Add Kenya-specific local cards with `cardType` field |
| `src/pages/Index.tsx` | Default to "Local 🇰🇪", insert BreakingNewsTicker, update filtering logic |

## `src/components/GenreTabs.tsx`

Reorder genres array:
```
"Local 🇰🇪", "Trending 🔥", "Sports", "Music & Culture", "Entertainment", "Crypto & Money", "Politics & Society", "Random"
```

No other changes — existing gold underline + scroll behavior stays.

## `src/components/BreakingNewsTicker.tsx`

New component. Full-width strip, height 44px, `bg-[#0A0A0A] dark:bg-[#1C1C1C]`.

Left: Red pulsing dot + "Breaking" pill (`animate-pulse` on the dot, Inter Semibold 12px white).

Right: CSS `@keyframes ticker` infinite horizontal scroll of hardcoded headlines separated by " · ". Headlines array:
- "Harambee Stars confirm squad for AFCON qualifiers"
- "CBK holds interest rates steady"
- "Nairobi traffic: major jam on Mombasa Road"
- "KPL matchday results in"

Clicking a headline navigates to `/call-it` with a toast "Be first to call this".

## `src/components/OpinionCard.tsx`

Add optional `cardType` to `OpinionCardData`: `"breaking" | "callit-pick" | "community"`.

Render badge in top row before genre pill:
- **breaking**: Red pulsing dot + "Breaking" `text-[#EF4444]` 10px
- **callit-pick**: ⭐ + "Callit Pick" `text-gold` 10px
- **community**: Person icon + "Community" `text-muted-foreground` 10px

## `src/data/sampleCards.ts`

Add ~4 Kenya-specific Local cards with various `cardType` values:
- "Will Harambee Stars qualify for AFCON 2026?" (breaking, event)
- "Is Nairobi the best city in East Africa?" (callit-pick, crowd)
- "Will KES hit 150 against USD this year?" (breaking, metric)
- "Is gengetone dead?" (community, crowd)

Update existing Nairobi rain card to have `cardType: "community"`.

## `src/pages/Index.tsx`

- Default `activeGenre` to `"Local 🇰🇪"`.
- Insert `<BreakingNewsTicker />` between `<Navbar />` and `<main>`.
- Update filtering: when `"Local 🇰🇪"` is active, filter by `genre === "Local"`. When `"Trending 🔥"`, show all. Otherwise match genre name (strip emoji for comparison).
- Local tab empty state: "Nothing local yet — be first to call it" with gold "Make a Local Call" button linking to `/call-it`.

## Technical Notes
- Ticker uses CSS animation (`translateX`) for smooth continuous scroll, duplicated content for seamless loop.
- No backend needed — all hardcoded sample data.
- Card type badges use existing design tokens (gold, muted-foreground, #EF4444).

