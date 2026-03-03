

# System Generated Calls & Social Media Sourcing

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/data/systemGeneratedCards.ts` | Create — system-generated "Callit Pick" calls with source metadata |
| `src/components/FeaturedStrip.tsx` | Create — horizontal scrollable strip of top picks |
| `src/components/OpinionCard.tsx` | Add `socialSource` and `isSystemGenerated` fields to interface, render social source tag |
| `src/data/sampleCards.ts` | Merge system cards into exports |
| `src/pages/Index.tsx` | Insert FeaturedStrip below BreakingNewsTicker, merge system cards into feed |
| `src/pages/OpinionDetail.tsx` | Show source attribution section at bottom for system-generated calls |

## `src/data/systemGeneratedCards.ts`

New file with ~8 system-generated cards. Each card has additional fields:
- `isSystemGenerated: true`
- `cardType: "callit-pick"`
- `creator: "callit"` (system account)
- `socialSource?: { platform: "twitter" | "instagram" | "tiktok" | "news"; label: string; url?: string }`
- `generatedFrom?: string` (e.g. "Twitter Kenya Trends", "Nation.co.ke", "CoinGecko")
- All seeded with 50 coins (system founding stake)

Sample cards:
1. "Will Gor Mahia win the SPL title this season?" — Event, Local, source: KPL
2. "Is Bien the best Kenyan artist right now?" — Crowd, Local, source: Twitter Kenya
3. "Will Bitcoin hit $100k before June?" — Metric, Crypto, source: CoinGecko
4. "Will Harambee Stars qualify for AFCON 2025?" — Event, Local, source: Nation
5. "Is Nairobi the best city to live in East Africa?" — Crowd, Local, source: Instagram Kenya
6. "Will Ethic Entertainment drop a new album this year?" — Event, Local, source: TikTok Kenya
7. "Will M-Pesa transaction fees go down?" — Event, Local, source: Standard Digital
8. "Is Nyashinski Kenya's greatest comeback story?" — Crowd, Local, source: Twitter Kenya

Export both the array and a helper to get top 5 by activity (coins + callerCount).

## `src/components/OpinionCard.tsx`

Extend `OpinionCardData` interface:
```ts
socialSource?: { platform: "twitter" | "instagram" | "tiktok" | "news"; label: string; url?: string };
isSystemGenerated?: boolean;
generatedFrom?: string;
```

Below the creator row, if `socialSource` exists, render a small tag:
- Twitter: `𝕏` icon + "Trending on X Kenya" — `text-[10px] text-muted-foreground`
- Instagram: IG icon + "Trending on Instagram"
- TikTok: TikTok icon + "Trending on TikTok"
- News: newspaper icon + label text

For system-generated cards, show "callit" as creator with a gold verified-style checkmark instead of avatar letter.

## `src/components/FeaturedStrip.tsx`

New component. Horizontal scrollable strip:
- Header row: "Callit's Top Picks" left (Inter Semibold 13px gold), "See all" right (gold link, navigates to feed with Trending tab)
- Horizontal scroll container with 5 compact cards
- Each compact card: `w-[260px]` fixed width, gold border, 16px padding
  - Question truncated to 2 lines
  - Resolution type pill + genre pill
  - Coins in pool + time left
  - "Callit Pick" badge
  - Click navigates to `/opinion/:id`
- Snap scroll with `scroll-snap-type: x mandatory`

## `src/pages/Index.tsx`

- Import `FeaturedStrip` and system cards
- Merge system-generated cards with `sampleCards` into a combined `allCards` array
- Insert `<FeaturedStrip cards={topPicks} />` between `<BreakingNewsTicker />` and `<main>`
- `topPicks` = top 5 system cards sorted by `coins + (callerCount * 10)` descending
- Feed filtering works on combined array

## `src/pages/OpinionDetail.tsx`

At bottom of detail page, if card has `isSystemGenerated`:
- Separator line
- "Generated from [generatedFrom]" — muted grey 11px
- If `socialSource.url`: "View original source →" gold link
- "System seeded · 50 coins founding stake" muted 11px

## Technical Notes
- No backend — all hardcoded sample data simulating what real API sources would provide
- Social platform icons use simple text/emoji markers (𝕏, 📸, 🎵, 📰) to avoid icon library additions
- System cards use `creator: "callit"` with special avatar treatment (gold background, "C" letter or star)

