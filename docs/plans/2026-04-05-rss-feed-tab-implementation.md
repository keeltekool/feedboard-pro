# RSS Feed Tab — Implementation Plan

**Date:** 2026-04-05
**Design:** [rss-feed-tab-design.md](2026-04-05-rss-feed-tab-design.md)
**Estimated files:** 7 (1 new, 6 modified)

---

## Phase 1: Foundation (Tasks 1-2)

### Task 1: Add `"rss"` to FeedType
**File:** `src/types/index.ts`
- Add `"rss"` to `FeedType` union type

### Task 2: Create RSS/Atom parser
**File:** `src/lib/parsers/rss.ts` (NEW)
- Import shared utilities from `./shared`
- `fetchRss(url: string): Promise<PreviewResponse>`
- Fetch URL with 10s timeout, User-Agent header
- Detect format: `<rss` → parseRss2(), `<feed` → parseAtom()
- `parseRss2(xml)`: regex split on `<item>`, extract title/link/pubDate/description/thumbnail
- `parseAtom(xml)`: regex split on `<entry>`, extract title/link[href]/updated/summary/thumbnail
- `extractFeedTitle(xml)`: get feed-level `<title>` for auto-naming
- Thumbnail extraction: media:content url → media:thumbnail url → enclosure[type*=image] url → first <img src> in description
- HTML stripping + entity decoding on descriptions, truncate 200 chars
- Cap 50 items, return `{ articles, rssUrl: url, articleCount, feedTitle }`

---

## Phase 2: API Integration (Task 3)

### Task 3: Wire parser into preview endpoint
**File:** `src/app/api/feeds/preview/route.ts`
- Import `fetchRss` from parsers
- Add `case "rss"`: call `fetchRss(query)` (query = the URL)
- Return `feedTitle` in response (for auto-naming, like YouTube returns `channelName`)

---

## Phase 3: UI (Tasks 4-6)

### Task 4: Add RSS tab to FeedCreator
**File:** `src/components/FeedCreator.tsx`
- Add `"rss"` to `SOURCE_TABS` array with label "RSS" and icon
- RSS input: single URL field, placeholder "Enter RSS feed URL, e.g. https://example.com/feed.xml"
- No language dropdown for RSS type
- Basic URL validation before preview (starts with http/https)
- Auto-name: use `feedTitle` from response, fallback to domain extraction
- Preview + Save flow unchanged

### Task 5: Add RSS group to Sidebar
**File:** `src/components/Sidebar.tsx`
- Add `"rss"` to `SOURCE_CONFIG` with icon (use Rss/Signal icon from lucide), label "RSS"
- Position: after Reddit

### Task 6: Handle RSS type in FeedDetail
**File:** `src/components/FeedDetail.tsx`
- Add RSS to type badge color/label mapping
- For RSS feeds, show URL in metadata section (already shows rss_url, just needs label)

---

## Checkpoint: Visual Verification

After all 6 tasks:
1. `npm run dev` on port 3099
2. Open browser → Create New Feed → verify RSS tab appears
3. Paste a known RSS feed (e.g. `https://hnrss.org/frontpage`) → Preview → verify articles render
4. Paste an Atom feed (e.g. a YouTube feed URL) → verify Atom parsing works
5. Save feed → verify it appears in sidebar under RSS group
6. Click saved feed → verify FeedDetail loads and refreshes
7. Test error case: paste invalid URL → verify error message
8. Test error case: paste non-RSS URL → verify "not an RSS feed" message

---

## Task 7: Deploy + Smoke Test

- `vercel --prod`
- Verify on live URL: create RSS feed, preview, save, view
