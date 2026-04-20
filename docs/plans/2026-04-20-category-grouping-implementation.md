# Implementation Plan: Feed Categories

> Date: 2026-04-20
> PRD: 2026-04-20-category-grouping-embed-design.md
> Status: AWAITING APPROVAL

---

## Phase 1: Data Layer (Schema + Migration + Types)

### Task 1.1 — Drizzle schema: feed_categories table + feeds FK

**File:** `src/lib/schema.ts`

**Changes:**
- Add `feedCategories` table with columns: id, name, slug, type, isPublic, shareToken, createdAt
- Add `categoryId` integer column to existing `feeds` table (nullable, no Drizzle-level FK — Neon serverless doesn't enforce FK constraints, we handle in app logic)

**Success criteria:**
- Schema file has both table definitions
- TypeScript compiles without errors

### Task 1.2 — Push schema + backfill data

**Steps:**
1. Copy DATABASE_URL from `.env.local` to `.env` (drizzle-kit reads `.env`)
2. Run `npx drizzle-kit push`
3. Verify tables exist via Neon console or SQL
4. Run backfill SQL:
   ```sql
   INSERT INTO feed_categories (name, slug, type, is_public) VALUES ('AI & Tech', 'ai-and-tech', 'youtube', false);
   INSERT INTO feed_categories (name, slug, type, is_public) VALUES ('DJ Techniques', 'dj-techniques', 'youtube', false);
   UPDATE feeds SET category_id = (SELECT id FROM feed_categories WHERE slug = 'ai-and-tech') WHERE type = 'youtube';
   ```

**Success criteria:**
- `feed_categories` table exists with 2 rows
- All 12 YouTube feeds have `category_id` pointing to "AI & Tech"
- `feeds.category_id` column exists and is nullable

### Task 1.3 — TypeScript types

**File:** `src/types/index.ts`

**Changes:**
- Add `FeedCategory` interface
- Add `categoryId: number | null` to `Feed` interface
- Add `category?: FeedCategory` to `Feed` interface (for joined queries)

**Success criteria:**
- Types compile
- Existing code still compiles (categoryId is nullable, category is optional — no breaking changes)

### Phase 1 checkpoint
- `npm run build` passes
- App runs locally, existing functionality unchanged (sidebar, feeds, group views all work)

---

## Phase 2: API Layer

### Task 2.1 — Categories CRUD API

**New files:**
- `src/app/api/categories/route.ts` — GET (list, optional `?type=` filter) + POST (create)
- `src/app/api/categories/[id]/route.ts` — PUT (update name/slug) + DELETE (cascade SET NULL on feeds)

**Slug generation:** `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`
**Slug collision:** Query DB for existing slug, append `-2`, `-3` if needed.

**POST body:** `{ name: string, type: string }`
**PUT body:** `{ name?: string }` (re-generates slug from new name)
**DELETE:** Update all feeds with this category_id to NULL, then delete category row.

**Success criteria:**
- `curl POST /api/categories` with `{ name: "Test", type: "youtube" }` → creates row, returns category with slug "test"
- `curl GET /api/categories?type=youtube` → returns 3 categories (AI & Tech, DJ Techniques, Test)
- `curl PUT /api/categories/[testId]` with `{ name: "Test Renamed" }` → slug updates to "test-renamed"
- `curl DELETE /api/categories/[testId]` → deletes, no orphan feeds
- Creating duplicate name for same type → gets slug "test-2"

### Task 2.2 — Update GET /api/feeds to join category

**File:** `src/app/api/feeds/route.ts`

**Changes:**
- GET handler: left join `feed_categories` on `feeds.category_id = feed_categories.id`
- Return each feed with nested `category: { id, name, slug, type } | null`

**Success criteria:**
- `curl GET /api/feeds` → each YouTube feed has `category: { id: X, name: "AI & Tech", slug: "ai-and-tech", type: "youtube" }`
- News/Reddit/RSS feeds have `category: null`
- Existing frontend still works (extra field is ignored until UI is updated)

### Task 2.3 — Update POST /api/feeds to accept categoryId

**File:** `src/app/api/feeds/route.ts`

**Changes:**
- POST handler: accept optional `categoryId` in body
- If provided, verify category exists before inserting
- Store in feeds row

**Success criteria:**
- Creating a feed with `categoryId` → saved correctly
- Creating a feed without `categoryId` → NULL (existing behavior preserved)
- Creating a feed with non-existent `categoryId` → 400 error

### Task 2.4 — Update PUT /api/feeds/[id] for categoryId

**File:** `src/app/api/feeds/[id]/route.ts`

**Changes:**
- Accept `categoryId` in PUT body (can be a number or `null` to uncategorize)

**Success criteria:**
- PUT with `{ categoryId: 2 }` → feed moves to DJ Techniques
- PUT with `{ categoryId: null }` → feed becomes uncategorized
- Existing rename (`{ name: "..." }`) still works

### Task 2.5 — Update POST /api/feeds/preview-group to filter by categoryId

**File:** `src/app/api/feeds/preview-group/route.ts`

**Changes:**
- Accept optional `categoryId` in POST body
- When set: `WHERE type = X AND category_id = Y`
- When not set: `WHERE type = X` (existing behavior — all feeds of type)

**Success criteria:**
- POST with `{ type: "youtube" }` → returns all 12 YouTube feeds merged (unchanged)
- POST with `{ type: "youtube", categoryId: 1 }` → returns only AI & Tech feeds
- POST with `{ type: "youtube", categoryId: 2 }` → returns only DJ Techniques feeds (0 initially)

### Phase 2 checkpoint
- All API endpoints respond correctly via curl/Postman
- `npm run build` passes
- App runs locally, existing UI still works (API returns extra data but UI ignores it)

---

## Phase 3: Frontend — Sidebar Category Nesting

### Task 3.1 — Page state: activeCategory + categories list

**File:** `src/app/page.tsx`

**Changes:**
- Add state: `activeCategory: { id: number; slug: string; name: string } | null`
- Add state: `categories: FeedCategory[]`
- Fetch categories from GET /api/feeds response (already joined) — derive unique categories from feeds data, no extra API call needed
- Add `handleSelectCategory(category)` — sets activeCategory, clears activeFeedId + showCreator
- Update `handleSelectGroup(type)` — also clears activeCategory
- Pass `categories`, `activeCategory`, `onSelectCategory` to Sidebar
- Pass `categoryId`, `categoryName` to GroupOverview when activeCategory is set

**Success criteria:**
- State exists, no runtime errors
- Sidebar receives new props (renders same as before until Task 3.2)

### Task 3.2 — Sidebar 3-level nesting

**File:** `src/components/Sidebar.tsx`

**Changes:**
- Receive `categories` and `activeCategory` and `onSelectCategory` props
- For each source type, check if any categories exist for that type
- **If categories exist:** render category sub-groups instead of flat feed list
  - Each category row: name + feed count + chevron for expand/collapse
  - Click category name → `onSelectCategory(category)`
  - Click chevron → expand/collapse individual feeds within that category
  - Uncategorized feeds (category_id = NULL) → show under "Other" pseudo-group at bottom (only if there are any)
  - Category active state highlighting (cyan bg, like current feed/group active states)
- **If no categories:** render flat feed list exactly as today (News, Reddit, RSS path)
- Expand/collapse state: `Record<string, boolean>` keyed by `cat-${id}` for categories

**Behavior detail:**
- Type header click → `onSelectGroup(type)` (unchanged — shows "All YouTube")
- Type chevron → expand/collapse all sub-groups for that type
- Category name click → `onSelectCategory(category)` 
- Category chevron → expand/collapse feeds within that category
- Feed click → `onSelectFeed(id)` (unchanged)

**Success criteria:**
- YouTube section shows "AI & Tech (12)" and "DJ Techniques (0)" sub-groups
- Expanding AI & Tech shows the 12 channel feeds indented
- Clicking "AI & Tech" label highlights it
- Clicking "YouTube" header still works (shows all)
- News, Reddit, RSS sections look and behave exactly as before
- Collapsing/expanding works at both category and type level

### Phase 3 checkpoint
- Visual verification in browser:
  - Sidebar renders 3-level nesting for YouTube
  - News/Reddit/RSS unchanged
  - All expand/collapse interactions work
  - Active state highlighting works for type, category, and feed levels
  - No layout shifts or overflow issues with the deeper nesting

---

## Phase 4: Frontend — GroupOverview Category Filtering

### Task 4.1 — GroupOverview accepts category filter

**File:** `src/components/GroupOverview.tsx`

**Changes:**
- Accept optional props: `categoryId?: number`, `categoryName?: string`
- POST to preview-group includes `categoryId` when set
- Header shows `categoryName` or falls back to "All [Type]"
- Feed count label reflects filtered count

**Success criteria:**
- Clicking "AI & Tech" in sidebar → main area shows "AI & Tech", 12 feeds, only AI channel videos
- Clicking "DJ Techniques" → shows "DJ Techniques", 0 feeds, empty state
- Clicking "YouTube" header → shows "All YouTube", 12 feeds (same as today)
- Refresh button works in all three modes

### Phase 4 checkpoint
- Browser verification:
  - Switch between "All YouTube", "AI & Tech", "DJ Techniques" — correct articles each time
  - Feed counts accurate
  - Refresh works
  - No stale data when switching between views

---

## Phase 5: Frontend — FeedCreator + FeedDetail Category Support

### Task 5.1 — FeedCreator: category dropdown

**File:** `src/components/FeedCreator.tsx`

**Changes:**
- Accept `categories: FeedCategory[]` prop (passed from page.tsx)
- When source type is selected, filter categories for that type
- Show "Category" dropdown below query input (only when categories exist for selected type)
- Dropdown options: "None", existing categories, "─────", "+ Create new..."
- "Create new..." → shows inline text input below dropdown for new category name
- On save: if new category name entered, POST /api/categories first, get ID, then POST /api/feeds with that categoryId
- On save: if existing category selected, POST /api/feeds with that categoryId
- On save: if "None", POST /api/feeds without categoryId (existing behavior)
- After save, call parent's refresh to pick up new category if created

**Success criteria:**
- YouTube tab shows category dropdown with "None", "AI & Tech", "DJ Techniques", "+ Create new..."
- News tab shows no category dropdown (no categories for that type)
- Selecting "DJ Techniques" + saving → feed created with correct categoryId
- "Create new..." → type "Test Category" → save → new category created + feed assigned
- "None" → feed created with NULL categoryId

### Task 5.2 — FeedDetail: category badge + edit

**File:** `src/components/FeedDetail.tsx`

**Changes:**
- Accept `categories: FeedCategory[]` prop
- Show category badge pill next to type badge: `[YouTube] [AI & Tech]`
- Category badge color: `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300` (distinguishable from cyan type badge)
- Badge is clickable → shows dropdown with same options as FeedCreator (existing categories + None + Create new)
- Selecting a different category → PUT /api/feeds/[id] with new categoryId → call onUpdate
- Feed without category → show "Uncategorized" badge in muted style, still clickable to assign

**Success criteria:**
- YouTube feed shows two badges: [YouTube] [AI & Tech]
- News feed shows one badge: [Google News] (no category badge since none assigned)
- Clicking category badge → dropdown appears
- Changing category → saves immediately, sidebar reflects change after refresh
- Setting to "None" → badge changes to "Uncategorized"

### Phase 5 checkpoint
- Browser verification:
  - Create new YouTube feed with "DJ Techniques" category → appears under DJ Techniques in sidebar
  - Create new YouTube feed with "None" → appears under "Other" in sidebar
  - Edit existing feed's category from "AI & Tech" to "DJ Techniques" → moves in sidebar
  - Create new feed with "Create new..." category → new category appears in sidebar
  - All existing feed operations still work (rename, delete, preview)

---

## Phase 6: End-to-End Testing + Deploy

### Task 6.1 — Full E2E walkthrough in browser

**Test script (execute in order):**

1. **Load app** → verify sidebar shows YouTube with "AI & Tech (12)" and "DJ Techniques (0)"
2. **Click "YouTube"** → verify "All YouTube" view with 12 feeds merged
3. **Click "AI & Tech"** → verify filtered view, same 12 feeds, header says "AI & Tech"
4. **Click "DJ Techniques"** → verify empty state "No articles found across feeds"
5. **Click individual feed** (e.g., "Aakash Gupta") → verify feed detail with [YouTube] [AI & Tech] badges
6. **Click category badge** on feed detail → verify dropdown shows options
7. **Click "+ New Feed"** → select YouTube → verify category dropdown appears
8. **Type a DJ channel** (e.g., `@CrossfaderTV`) → select "DJ Techniques" category → Preview → Save
9. **Verify** new feed appears under "DJ Techniques (1)" in sidebar
10. **Click "DJ Techniques"** → verify merged view shows Crossfader videos
11. **Click "YouTube"** → verify "All YouTube" now shows 13 feeds (12 AI + 1 DJ merged)
12. **Click the new Crossfader feed** → verify [YouTube] [DJ Techniques] badges
13. **Change its category** to "AI & Tech" via badge dropdown → verify it moves in sidebar
14. **Change back** to "DJ Techniques"
15. **Verify News section** → unchanged, no category dropdown, flat list, same behavior
16. **Verify RSS section** → unchanged
17. **Collapse/expand** AI & Tech sub-group → works
18. **Collapse/expand** DJ Techniques sub-group → works
19. **Collapse/expand** YouTube type → both sub-groups collapse
20. **Dark mode toggle** → verify sidebar nesting renders correctly in dark theme

### Task 6.2 — Edge case testing

1. **Create feed with "Create new..." category** → verify new category appears in sidebar + dropdown
2. **Delete the only feed in a category** → verify category stays in sidebar with (0)
3. **Rename a feed** → verify it still belongs to same category
4. **Refresh page (F5)** → verify all state persists from DB

### Task 6.3 — Build + Deploy

1. `npm run build` → must pass with zero errors
2. Commit all changes
3. Push to GitHub → Vercel auto-deploys
4. Wait 30s → verify on https://feedboard-pro.vercel.app via chrome-devtools MCP
5. Run abbreviated test script (items 1-5, 11, 15) on production

**Final success criteria:**
- Production app shows categorized YouTube sidebar
- AI & Tech and DJ Techniques are separate merged views
- All existing functionality (News, Reddit, RSS, individual feeds, create, edit, delete) works unchanged
- No console errors, no layout issues in light and dark mode

---

## File Change Summary

| File | Change type |
|------|-------------|
| `src/lib/schema.ts` | EDIT — add feedCategories table + categoryId column |
| `src/types/index.ts` | EDIT — add FeedCategory, update Feed |
| `src/app/api/categories/route.ts` | NEW — GET + POST |
| `src/app/api/categories/[id]/route.ts` | NEW — PUT + DELETE |
| `src/app/api/feeds/route.ts` | EDIT — join category, accept categoryId |
| `src/app/api/feeds/[id]/route.ts` | EDIT — accept categoryId in PUT |
| `src/app/api/feeds/preview-group/route.ts` | EDIT — filter by categoryId |
| `src/app/page.tsx` | EDIT — add activeCategory state, handlers, prop passing |
| `src/components/Sidebar.tsx` | EDIT — 3-level nesting logic |
| `src/components/GroupOverview.tsx` | EDIT — accept + use category filter |
| `src/components/FeedCreator.tsx` | EDIT — category dropdown |
| `src/components/FeedDetail.tsx` | EDIT — category badge + edit |

**New files: 2** | **Edited files: 10** | **Deleted files: 0**
