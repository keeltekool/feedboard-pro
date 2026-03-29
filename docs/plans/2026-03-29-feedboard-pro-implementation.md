# Feedboard Pro — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an RSS feed design studio where users create Google News / YouTube / Reddit feeds, preview live results with thumbnails, save feeds, and organize them in a collapsible sidebar grouped by source type.

**Architecture:** Next.js 16 single-page app with sidebar + main area layout. Feeds stored in Neon PostgreSQL via Drizzle ORM. RSS parsing via custom parsers (ported from Feedboard). No auth — single-user tool.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Neon PostgreSQL, Drizzle ORM, Vercel

---

## Phase 1: Foundation (Tasks 1-4)

### Task 1: Scaffold Next.js Project + Dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `.env.example`, `.env.local`, `.gitignore`
- Create: `drizzle.config.ts`

**Step 1: Initialize Next.js project**

```bash
cd /c/Users/Kasutaja/Claude_Projects/feedboard-pro
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --yes
```

If project already has files, use `--force` or init manually.

**Step 2: Install additional dependencies**

```bash
npm install @neondatabase/serverless drizzle-orm date-fns
npm install -D drizzle-kit dotenv
```

**Step 3: Create `.env.example`**

```
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
```

**Step 4: Create `.env.local` with actual Neon database URL**

Create a NEW Neon database called `feedboard-pro` in the Neon console (or use existing free-tier project). Add the connection string to `.env.local`.

**Step 5: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

### Task 2: Database Schema + Connection

**Files:**
- Create: `src/lib/schema.ts`
- Create: `src/lib/db.ts`

**Step 1: Create database schema**

```typescript
// src/lib/schema.ts
import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'google-news' | 'youtube' | 'reddit'
  query: text("query").notNull(),                   // keywords or channel URL
  language: varchar("language", { length: 10 }).default("en"),
  rssUrl: text("rss_url").notNull(),                // generated RSS URL
  lastTestedAt: timestamp("last_tested_at"),
  articleCount: integer("article_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
```

**Step 2: Create database connection**

```typescript
// src/lib/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Step 3: Push schema to database**

```bash
npx drizzle-kit push
```

Verify: should create `feeds` table with all columns.

**Step 4: Commit**

```bash
git add src/lib/schema.ts src/lib/db.ts
git commit -m "feat: add feeds database schema and connection"
```

---

### Task 3: Port Brand Assets + Theme

**Files:**
- Copy: `Brand_assets/` from `data-tracker` to `feedboard-pro/Brand_assets/`
- Copy: logos/favicons to `public/`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/ThemeToggle.tsx`

**Step 1: Copy brand assets from Feedboard**

```bash
cp -r /c/Users/Kasutaja/Claude_Projects/data-tracker/Brand_assets /c/Users/Kasutaja/Claude_Projects/feedboard-pro/Brand_assets
cp /c/Users/Kasutaja/Claude_Projects/data-tracker/Brand_assets/favicon-32.png /c/Users/Kasutaja/Claude_Projects/feedboard-pro/public/favicon.png
cp /c/Users/Kasutaja/Claude_Projects/data-tracker/Brand_assets/app-icon-192.png /c/Users/Kasutaja/Claude_Projects/feedboard-pro/public/
cp /c/Users/Kasutaja/Claude_Projects/data-tracker/Brand_assets/app-icon-512.png /c/Users/Kasutaja/Claude_Projects/feedboard-pro/public/
cp /c/Users/Kasutaja/Claude_Projects/data-tracker/Brand_assets/logo-compact.svg /c/Users/Kasutaja/Claude_Projects/feedboard-pro/public/
cp /c/Users/Kasutaja/Claude_Projects/data-tracker/Brand_assets/logo-dark.svg /c/Users/Kasutaja/Claude_Projects/feedboard-pro/public/
```

**Step 2: Update `globals.css`**

Replace the default Next.js globals.css with Feedboard's brand theme:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0f172a;
}

.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

html {
  transition: background-color 0.2s ease, color 0.2s ease;
}

.dark ::-webkit-scrollbar { width: 8px; }
.dark ::-webkit-scrollbar-track { background: #1e293b; }
.dark ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
.dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
```

**Step 3: Create ThemeToggle component**

Port directly from Feedboard's `ThemeToggle.tsx` but update localStorage key to `feedboard-pro-theme`.

**Step 4: Update `layout.tsx`**

Set metadata (title: "Feedboard Pro", description), add Inter font import, clean up default Next.js boilerplate.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: port brand assets and theme from Feedboard"
```

---

### Task 4: Types + RSS Parsers (Google News, YouTube, Reddit)

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/parsers/google-news.ts` (port from Feedboard)
- Create: `src/lib/parsers/reddit.ts` (port from Feedboard)
- Create: `src/lib/parsers/youtube.ts` (new)
- Create: `src/lib/parsers/shared.ts` (shared XML helpers)

**Step 1: Create types**

```typescript
// src/types/index.ts
export type FeedType = "google-news" | "youtube" | "reddit";

export interface Feed {
  id: number;
  name: string;
  type: FeedType;
  query: string;
  language: string | null;
  rssUrl: string;
  lastTestedAt: Date | null;
  articleCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreviewArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  thumbnail?: string;
  description?: string;
}

export interface PreviewResponse {
  articles: PreviewArticle[];
  rssUrl: string;
  articleCount: number;
  error?: string;
}

export interface FeedsResponse {
  feeds: Feed[];
  error?: string;
}
```

**Step 2: Create shared XML parsing utilities**

```typescript
// src/lib/parsers/shared.ts
export function extractTag(xml: string, tag: string): string | null {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

export function extractAttribute(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]+${attr}="([^"]+)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

export function generateId(prefix: string, url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${prefix}-${Math.abs(hash).toString(36)}`;
}
```

**Step 3: Port Google News parser**

Port from Feedboard's `google-news.ts`. Key changes from Feedboard version:
- Import shared helpers instead of local copies
- Return `PreviewArticle` type (with optional `description` field)
- Accept `language` parameter (not hardcoded to "en")
- Return `rssUrl` alongside articles for saving
- Remove time filtering — show all available articles
- Increase limit from 25 to 50

**Step 4: Port Reddit parser**

Port from Feedboard's `reddit.ts`. Same changes: remove time filter, use shared helpers, return `PreviewArticle[]`. Support both subreddit-specific (`/r/{sub}.rss`) and search (`/search.rss?q={keywords}`) modes.

Extract thumbnail from Reddit's `<content>` HTML (often contains embedded images).

**Step 5: Create YouTube parser**

New parser for YouTube Atom feeds:
- `resolveChannelId(input)` — resolves channel name/URL/@handle to channel ID
  - If already `UC...` (24 chars), return as-is
  - If URL with `/channel/UC...`, extract directly
  - For @handle or name, fetch YouTube page and extract `channelId` from page source
- `fetchYouTubeRSS(channelId)` — fetches `youtube.com/feeds/videos.xml?channel_id={id}`
- Parse `<entry>` elements, extract: `yt:videoId`, title, published, `media:thumbnail` URL
- Fallback thumbnail: `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`
- Extract channel name from feed `<title>` for source field

**Step 6: Commit**

```bash
git add src/types/ src/lib/parsers/
git commit -m "feat: add types and RSS parsers for Google News, YouTube, Reddit"
```

---

## CHECKPOINT 1: Verify parsers work

Before building UI, verify all 3 parsers work by testing the API routes in Task 5. After Task 5, hit each preview endpoint and confirm articles + thumbnails come back.

---

## Phase 2: API Routes (Tasks 5-6)

### Task 5: Preview API Route

**Files:**
- Create: `src/app/api/feeds/preview/route.ts`
- Create: `src/app/api/youtube/resolve/route.ts`

**Step 1: Create preview endpoint**

`POST /api/feeds/preview` accepts `{ type, query, language }`:
- Routes to correct parser based on type
- For YouTube: resolves channel ID first, then fetches RSS
- Returns `{ articles, rssUrl, articleCount }`

**Step 2: Create YouTube channel resolver endpoint**

`POST /api/youtube/resolve` accepts `{ input }`:
- Calls `resolveChannelId(input)`
- Returns `{ channelId }`

**Step 3: Test all 3 preview types**

Run `npm run dev` and test:
- Google News: `{ "type": "google-news", "query": "eIDAS", "language": "en" }`
- YouTube: `{ "type": "youtube", "query": "@anthropic" }`
- Reddit: `{ "type": "reddit", "query": "eIDAS" }`

Verify each returns articles with thumbnails.

**Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add preview and YouTube resolve API routes"
```

---

### Task 6: Feed CRUD API Routes

**Files:**
- Create: `src/app/api/feeds/route.ts`
- Create: `src/app/api/feeds/[id]/route.ts`

**Step 1: Create list + create endpoint**

`GET /api/feeds` — returns all feeds sorted by createdAt desc
`POST /api/feeds` — creates new feed with name, type, query, language, rssUrl, articleCount

**Step 2: Create get/update/delete endpoint**

`GET /api/feeds/[id]` — returns single feed
`PUT /api/feeds/[id]` — updates feed fields + sets updatedAt
`DELETE /api/feeds/[id]` — deletes feed

**Step 3: Commit**

```bash
git add src/app/api/feeds/
git commit -m "feat: add feed CRUD API routes"
```

---

## CHECKPOINT 2: All API routes working

Test all endpoints. Create a feed, list feeds, update, delete. Preview all 3 source types. All must return valid JSON.

---

## Phase 3: UI Components (Tasks 7-11)

### Task 7: Sidebar Component

**Files:**
- Create: `src/components/Sidebar.tsx`

The sidebar shows:
- "+ New Feed" button at the top
- Collapsible sections for each source type (News, YouTube, Reddit)
- Each section shows feed count badge and is click-to-expand/collapse
- Feeds listed under their source type
- Active feed highlighted in cyan
- Source-appropriate icons

**Implementation details:**
- Accordion state stored in local component state
- Accept props: `feeds: Feed[]`, `activeFeedId: number | null`, `onSelectFeed: (id: number) => void`, `onNewFeed: () => void`
- Group feeds by `type` field
- Each section header: icon + label + count badge + chevron (rotates on expand)
- Feedboard styling: cyan active state, slate borders, hover effects

**Step 1: Build the component with full accordion behavior**

**Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add sidebar component with collapsible source sections"
```

---

### Task 8: Article Preview Card Component

**Files:**
- Create: `src/components/ArticleCard.tsx`

Based on Feedboard's `NewsCard.tsx` but adapted:
- Shows thumbnail (left side or top, depending on availability)
- Title (clickable, opens in new tab)
- Description snippet (if available)
- Source name with favicon + publish date
- No read tracking, no vault — this is preview only
- Works for all 3 source types (news, youtube, reddit)

**YouTube cards:** Show video thumbnail (16:9 aspect ratio), title, channel name, date
**News cards:** Show article image if available + favicon, title, source, date
**Reddit cards:** Show post thumbnail if available, title, subreddit, date

**Step 1: Build the component**

Port Feedboard's card styling (rounded-xl, border, hover shadow, cyan accent on hover). Add thumbnail rendering with fallback to favicon-only layout.

**Step 2: Commit**

```bash
git add src/components/ArticleCard.tsx
git commit -m "feat: add article preview card component with thumbnails"
```

---

### Task 9: Feed Creator Component

**Files:**
- Create: `src/components/FeedCreator.tsx`

The "Create New Feed" form that appears in the main area:
- Source type tabs: News / YouTube / Reddit (cyan active underline)
- Input field adapts per source:
  - News: keyword input + language dropdown (en, de, fr, es, etc.)
  - YouTube: channel name or URL input
  - Reddit: subreddit or keyword input
- "Preview" button (cyan primary)
- Loading spinner during fetch
- Results area: article count badge + scrollable ArticleCard list
- "Save Feed" button (visible after preview) + name input
- Error state if preview fails

**State management:**
- `sourceType`, `query`, `language`, `isLoading`, `previewResult`, `feedName`, `isSaving`

**Step 1: Build the full form with preview and save flow**

**Step 2: Commit**

```bash
git add src/components/FeedCreator.tsx
git commit -m "feat: add feed creator component with preview and save"
```

---

### Task 10: Feed Detail Component

**Files:**
- Create: `src/components/FeedDetail.tsx`

Shown when a feed is selected from the sidebar:
- Header: Feed name + source type icon + badge
- RSS URL in a copyable input with "Copy" button (cyan)
- Metadata: keywords/query, language, created date, article count, last tested
- Actions: Edit (pencil), Delete (trash with confirm)
- Live preview: fetches current articles, shows ArticleCard list
- "Refresh Preview" button to re-fetch

**Step 1: Build the component**

Fetch articles on mount via `/api/feeds/preview` using the feed's type + query. Display with loading spinner.

**Step 2: Commit**

```bash
git add src/components/FeedDetail.tsx
git commit -m "feat: add feed detail component with live preview"
```

---

### Task 11: Main Page — Wire Everything Together

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Layout:**
```
Header: Logo ("Feed/board Pro") + ThemeToggle
Body:   Sidebar (260px fixed) | Main Area (flex-1)
        Main = FeedCreator (when "+ New Feed") or FeedDetail (when feed selected)
```

**State management (page.tsx):**
- `feeds`: all feeds from GET /api/feeds
- `activeFeedId`: selected feed ID (null = show creator)
- `showCreator`: boolean
- Fetch feeds on mount
- Refetch after save/delete
- Logo: "Feed" in slate-800, "board" in cyan-600, "Pro" as small badge

**Step 1: Build main page wiring all components**

**Step 2: Update layout.tsx with Inter font and metadata**

**Step 3: Full E2E browser test**

1. Open app — see empty state with "+ New Feed"
2. Click "+ New Feed" — see FeedCreator
3. Select News, type "eIDAS", Preview — see articles with thumbnails
4. Save as "Google News - eIDAS" — appears in sidebar under News
5. Click feed — see FeedDetail with preview
6. Create YouTube + Reddit feeds — appear under correct sections
7. Collapse/expand sidebar sections
8. Dark mode toggle
9. Delete a feed — sidebar updates

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: wire main page with sidebar, creator, and detail views"
```

---

## CHECKPOINT 3: Full E2E browser test via chrome-devtools MCP

Walk through the complete flow listed in Task 11 Step 3. Fix any issues before deploying.

---

## Phase 4: Deploy + Polish (Tasks 12-13)

### Task 12: GitHub + Vercel Deployment

**Step 1: Create GitHub repo and push**

```bash
gh repo create keeltekool/feedboard-pro --public --source=. --push
```

**Step 2: Deploy to Vercel**

```bash
npx vercel --yes
npx vercel env add DATABASE_URL production
npx vercel --prod
```

**Step 3: Verify live deployment via chrome-devtools MCP**

**Step 4: Commit any deployment fixes**

---

### Task 13: Create STACK.md + Update Global STACK.md

**Files:**
- Create: `STACK.md` in project root
- Modify: `Claude_Projects/STACK.md` (add to Projects table + Services registry)

**Step 1: Create per-project STACK.md**

Document: tech stack, services, env vars, deployment, gotchas.

**Step 2: Update global STACK.md**

Add Feedboard Pro to Projects table. Update Neon entry if new database created.

**Step 3: Commit**

```bash
git add STACK.md
git commit -m "docs: add STACK.md"
```

---

## Summary

| Phase | Tasks | What |
|-------|-------|------|
| Foundation | 1-4 | Scaffold, DB, brand, parsers |
| API | 5-6 | Preview + CRUD routes |
| UI | 7-11 | Sidebar, cards, creator, detail, main page |
| Deploy | 12-13 | GitHub, Vercel, docs |

**Total: 13 tasks, 3 checkpoints**
