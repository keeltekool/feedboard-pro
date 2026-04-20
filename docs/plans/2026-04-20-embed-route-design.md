# PRD: Public Embed Route for Feed Categories

> Date: 2026-04-20
> Status: DRAFT — awaiting approval
> Depends on: Feed Categories (completed, live)

---

## Problem

Feedboard Pro categories (e.g., "DJ Techniques") contain curated YouTube channel feeds. There's no way to display these feeds on external sites. The user wants to iframe the DJ Techniques feed into a separate DJ learning site.

## Solution

Add a public embed route that renders a category's merged feed as a minimal, iframe-safe page. Add an embed settings UI in the category group view to toggle embeddability and copy the iframe snippet.

---

## Architecture

### Embed URL format

```
https://feedboard-pro.vercel.app/embed/youtube/dj-techniques?theme=dark
                                       ──────  ──────────────  ──────────
                                       [type]  [category slug] [options]
```

### Query parameters

| Param | Values | Default | Purpose |
|-------|--------|---------|---------|
| `theme` | `dark`, `light` | `light` | Background and card styling |
| `token` | string | — | Required if category has `share_token` set |

### Request flow

```
Browser loads iframe src
        │
        ▼
┌─────────────────────────────────┐
│  /embed/[type]/[slug]/page.tsx  │
│  (Server Component)             │
│                                 │
│  1. Query feed_categories       │
│     WHERE type = [type]         │
│     AND slug = [slug]           │
│                                 │
│  2. Not found? → 404 page       │
│     is_public = false? → 403    │
│     share_token set but         │
│     ?token mismatch? → 403      │
│                                 │
│  3. Query feeds                 │
│     WHERE category_id = cat.id  │
│                                 │
│  4. For each feed, fetch        │
│     articles via parser         │
│     (same as preview-group)     │
│                                 │
│  5. Merge, sort by date,        │
│     take top 50                 │
│                                 │
│  6. Render <EmbedView>          │
│     with articles + theme       │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  <EmbedView> (Client Component) │
│                                 │
│  - Receives initial articles    │
│    as props (SSR'd)             │
│  - Sets up setInterval          │
│    every 5 min → calls          │
│    /api/embed/[type]/[slug]     │
│    → replaces articles state    │
│  - Renders compact card list    │
│  - theme class on root div      │
│  - All links target="_blank"    │
│  - "Powered by Feedboard Pro"   │
│    watermark at bottom          │
└─────────────────────────────────┘
```

### Refresh API

```
GET /api/embed/[type]/[slug]?token=xxx
        │
        ▼
  Same validation as page route
  (is_public, share_token check)
        │
        ▼
  Returns JSON:
  {
    articles: PreviewArticle[],
    categoryName: string,
    feedCount: number
  }
```

---

## Scope

### Task 1: Embed page — server component

**New file:** `src/app/embed/[type]/[slug]/page.tsx`

**Behavior:**
1. Await `params` (Next.js 16: params is a Promise)
2. Query `feed_categories` where `type` = params.type AND `slug` = params.slug
3. If not found → render 404 message (styled, not Next.js default)
4. If `is_public === false` → render 403 "This feed is not public"
5. If `share_token` is set → read `searchParams.token`, compare. Mismatch → 403 "Invalid token"
6. Query `feeds` where `category_id` = category.id
7. For each feed, call the appropriate parser (youtube → resolveChannelId → fetchYouTube, etc.)
8. Use `Promise.allSettled` — failed feeds don't break the page
9. Merge all articles, sort by `publishedAt` descending, take top 50
10. Read `searchParams.theme` — default `"light"`
11. Pass `articles`, `theme`, `categoryName`, `type`, `slug`, `token` to `<EmbedView>`

**Layout:** This route must NOT inherit the main app layout (no sidebar, no header). Create `src/app/embed/layout.tsx` — minimal HTML wrapper with Inter font + Tailwind, no app chrome.

**Headers:**
- `export const dynamic = 'force-dynamic'`
- Next.js metadata: no indexing (`robots: { index: false }`)

### Task 2: Embed layout

**New file:** `src/app/embed/layout.tsx`

**Content:**
- Minimal `<html>` / `<body>` wrapper
- Import Inter font + globals.css for Tailwind
- No sidebar, no header, no ThemeToggle
- `<body>` has `margin: 0; padding: 0; overflow-x: hidden`

### Task 3: Embed client component

**New file:** `src/components/EmbedView.tsx`

**Props:**
```typescript
interface EmbedViewProps {
  initialArticles: PreviewArticle[];
  theme: "dark" | "light";
  categoryName: string;
  type: string;
  slug: string;
  token?: string;
}
```

**Behavior:**
- State: `articles` initialized from `initialArticles`
- `useEffect` with `setInterval(300000)` — every 5 min, fetch `/api/embed/[type]/[slug]?token=xxx`
- On successful fetch, replace `articles` state
- On failed fetch, keep existing articles (don't blank out)
- Cleanup interval on unmount

**Rendering:**
- Root div: `min-h-screen` + theme-based background
  - Light: `bg-white` body
  - Dark: `bg-slate-950` body
- Article cards — compact version:
  - Thumbnail (100x65px), title, source, relative time
  - No description (too noisy for embed)
  - Card styling:
    - Light: `bg-white border-slate-200` cards, `text-slate-900` title
    - Dark: `bg-slate-900 border-slate-800` cards, `text-slate-100` title
  - Hover: border goes cyan (matching main app)
  - All links: `target="_blank" rel="noopener noreferrer"`
- Header area (minimal):
  - Category name as small title
  - Feed count + "Updated every 5 min" subtext
  - No buttons, no controls
- Footer:
  - Small "Powered by Feedboard Pro" text, muted color
  - Links to `https://feedboard-pro.vercel.app` in `target="_blank"`
- Scrollbar:
  - Light: default browser scrollbar
  - Dark: thin custom scrollbar via CSS (`scrollbar-width: thin; scrollbar-color: #334155 #0f172a`)

### Task 4: Embed API endpoint

**New file:** `src/app/api/embed/[type]/[slug]/route.ts`

**GET handler:**
1. Read `type` and `slug` from params
2. Read `token` from searchParams
3. Query `feed_categories` — same validation as page (not found → 404, not public → 403, token mismatch → 403)
4. Query feeds by category_id
5. For each feed, fetch articles via parser
6. Merge, sort, take top 50
7. Return `{ articles, categoryName, feedCount }`

**CORS headers:** Add `Access-Control-Allow-Origin: *` for cross-origin iframe refresh.

### Task 5: iframe safety headers

**File:** `src/app/embed/[type]/[slug]/page.tsx` (or middleware)

**Approach:** Use Next.js route segment config + headers in the server component response. Since Next.js doesn't support per-route headers in app router easily, use `next.config.ts` headers config:

```typescript
async headers() {
  return [
    {
      source: '/embed/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
      ],
    },
  ];
}
```

This removes iframe restrictions ONLY for `/embed/*` routes. Main app routes are unaffected.

### Task 6: Embed settings UI in GroupOverview

**File:** `src/components/GroupOverview.tsx`

**Changes:**
- Only show when viewing a category (not "All YouTube")
- Add gear icon button next to category name in header
- Click toggles a settings panel below the header
- Settings panel contains:

```
┌─────────────────────────────────────────────────────────────────┐
│  Embed Settings                                            [X]  │
│                                                                 │
│  Make embeddable  [====○]  OFF                                  │
│                                                                 │
│  (when toggled ON:)                                             │
│                                                                 │
│  Theme:  [Light] [Dark ✓]                                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ <iframe src="https://feedboard-pro.vercel.app/embed/      │ │
│  │ youtube/dj-techniques?theme=dark" width="100%"            │ │
│  │ height="600" frameborder="0"></iframe>                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                    [ Copy ]     │
│                                                                 │
│  Preview: [Open in new tab ↗]                                   │
└─────────────────────────────────────────────────────────────────┘
```

- "Make embeddable" toggle → `PUT /api/categories/[id]` with `{ isPublic: true/false }`
- Theme selector → updates the iframe src in the snippet (client-side only, no API call)
- Copy button → copies iframe snippet to clipboard
- "Open in new tab" → opens embed URL in new tab for preview
- Accept `categories` prop from page.tsx (need category ID to call PUT)

**API update needed:** `PUT /api/categories/[id]` must also accept `isPublic` field.

### Task 7: Update PUT /api/categories/[id] for isPublic

**File:** `src/app/api/categories/[id]/route.ts`

**Changes:**
- Accept `isPublic` boolean in PUT body
- Update `is_public` column

### Task 8: Pass category to GroupOverview for embed settings

**File:** `src/app/page.tsx`

**Changes:**
- Pass `activeCategoryId` to GroupOverview (already done via `categoryId` prop)
- GroupOverview needs the category object (id, slug, isPublic) for the embed settings panel
- Either pass full category from page.tsx, or fetch it inside GroupOverview

**Approach:** Pass `category` object from page.tsx:
```typescript
const activeCategoryObj = categories.find(c => c.id === activeCategory?.id) || null;
```
Then pass `category={activeCategoryObj}` to GroupOverview.

---

## Embed Visual Design

### Light theme
```
┌────────────────────────────────────────────────────┐
│                                     bg-white        │
│  DJ Techniques                                      │
│  1 feed · Updated every 5 min                       │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ┌────────┐                                    │  │
│  │ │  thumb  │  We reviewed DJs Social Media     │  │
│  │ │ 100x65 │  Off The Record by Crossfader      │  │
│  │ │        │  25 days ago                        │  │
│  │ └────────┘                                    │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ ┌────────┐                                    │  │
│  │ │  thumb  │  You don't have to just be a DJ   │  │
│  │ │ 100x65 │  Off The Record by Crossfader      │  │
│  │ │        │  about 2 months ago                 │  │
│  │ └────────┘                                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│           Powered by Feedboard Pro                  │
└────────────────────────────────────────────────────┘
```

### Dark theme
```
┌────────────────────────────────────────────────────┐
│                                     bg-slate-950    │
│  DJ Techniques              text-slate-300          │
│  1 feed · Updated every 5 min   text-slate-500      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ┌────────┐                    bg-slate-900    │  │
│  │ │  thumb  │  We reviewed DJs Social Media     │  │
│  │ │ 100x65 │  Off The Record by Crossfader      │  │
│  │ │        │  25 days ago        text-slate-400  │  │
│  │ └────────┘                    border-slate-800│  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ ┌────────┐                                    │  │
│  │ │  thumb  │  You don't have to just be a DJ   │  │
│  │ │ 100x65 │  Off The Record by Crossfader      │  │
│  │ │        │  about 2 months ago                 │  │
│  │ └────────┘                                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│           Powered by Feedboard Pro  text-slate-600  │
└────────────────────────────────────────────────────┘
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Category not found (bad slug) | Render styled 404: "Feed not found" centered on page |
| Category exists but is_public = false | Render styled 403: "This feed is not public" |
| share_token set, no ?token param | Render 403: "Access token required" |
| share_token set, wrong ?token | Render 403: "Invalid access token" |
| share_token is NULL (not set) | No token check — open access (when is_public = true) |
| Category has 0 feeds | Render empty state: "No content available" |
| All feed fetches fail | Render empty state: "Unable to load content" |
| Some feed fetches fail | Show articles from successful feeds, ignore failures |
| Auto-refresh fetch fails | Keep showing current articles, retry on next interval |
| Very long category name | Truncate with ellipsis in embed header |
| Embed loaded without iframe (direct URL) | Works fine — it's just a web page |
| Multiple iframes on same page | Each has independent refresh interval |
| Browser blocks third-party cookies | No impact — no auth, no cookies used |

---

## Security Considerations

- Embed route is read-only — no mutations possible
- No auth tokens or DB credentials exposed to client
- share_token is a simple bearer token, not a session — acceptable for unlisted feeds
- CORS `Access-Control-Allow-Origin: *` only on embed API endpoint, not main API
- `robots: noindex` on embed pages — prevent search engine indexing
- No user input accepted in embed route (params are URL path segments, validated against DB)

---

## Out of Scope

- Embed for individual feeds (only category-level embeds)
- Embed customization beyond theme (no custom colors, fonts, card layouts)
- share_token generation UI (can be done later — for now, manually set via API if needed)
- Analytics / view counting on embeds
- Responsive breakpoints for embed (it fills container width, host page controls sizing)

---

## Task Breakdown

| # | Task | Files | Depends on |
|---|------|-------|------------|
| 1 | Embed layout (minimal, no app chrome) | `app/embed/layout.tsx` | — |
| 2 | iframe safety headers in next.config.ts | `next.config.ts` | — |
| 3 | EmbedView client component | `components/EmbedView.tsx` | — |
| 4 | Embed API endpoint GET /api/embed/[type]/[slug] | `app/api/embed/[type]/[slug]/route.ts` | — |
| 5 | Embed server page /embed/[type]/[slug] | `app/embed/[type]/[slug]/page.tsx` | 1, 3, 4 |
| 6 | Update PUT /api/categories/[id] to accept isPublic | `app/api/categories/[id]/route.ts` | — |
| 7 | Pass category object to GroupOverview from page.tsx | `app/page.tsx` | — |
| 8 | Embed settings UI in GroupOverview header | `components/GroupOverview.tsx` | 6, 7 |
| 9 | Build + deploy | — | all |
| 10 | E2E test: toggle embed on, copy snippet, load in iframe, verify dark theme, verify refresh | browser | 9 |

---

## File Change Summary

| File | Change type |
|------|-------------|
| `src/app/embed/layout.tsx` | NEW — minimal embed layout |
| `src/app/embed/[type]/[slug]/page.tsx` | NEW — embed server page |
| `src/components/EmbedView.tsx` | NEW — embed client component |
| `src/app/api/embed/[type]/[slug]/route.ts` | NEW — embed refresh API |
| `next.config.ts` | EDIT — add iframe headers for /embed/* |
| `src/app/api/categories/[id]/route.ts` | EDIT — accept isPublic in PUT |
| `src/app/page.tsx` | EDIT — pass category object to GroupOverview |
| `src/components/GroupOverview.tsx` | EDIT — embed settings panel |

**New files: 4** | **Edited files: 4** | **Deleted files: 0**
