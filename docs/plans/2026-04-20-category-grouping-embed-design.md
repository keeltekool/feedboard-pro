# PRD: Feed Categories (Topic Grouping)

> Date: 2026-04-20
> Status: DRAFT — awaiting approval
> Future: Public embed route will be built separately AFTER this is live

---

## Problem

All YouTube feeds (12 channels) are grouped under a single "All YouTube" bucket. Adding DJ-focused channels would mix with existing AI/Tech channels. No way to separate feeds by topic within a source type.

## Solution

Add a `feed_categories` table for topic grouping within source types. Link feeds to categories via foreign key. Sidebar shows sub-groups per category with their own merged views.

---

## Data Model

### New table: `feed_categories`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| id | serial | PK | Primary key |
| name | varchar(100) | NOT NULL | Display name, e.g. "AI & Tech" |
| slug | varchar(100) | NOT NULL, UNIQUE | URL-safe identifier, e.g. "ai-and-tech" |
| type | varchar(50) | NOT NULL | Source type this category belongs to ("youtube", "google-news", etc.) |
| is_public | boolean | false | Reserved for future embed feature |
| share_token | varchar(64) | NULL | Reserved for future embed feature |
| created_at | timestamp | now() | — |

**Why a separate table instead of a column on feeds:**
- Future embed settings (is_public, share_token) are category-level, not per-feed
- Renaming a category = one row update, not N feed updates
- Slug is stable (won't break future embed URLs when display name changes)
- Clean category listing without DISTINCT hacks
- Deleting last feed from category doesn't lose the category definition

### Alter `feeds` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| category_id | integer | NULL | FK → feed_categories.id, nullable |

- `NULL` category_id = uncategorized feed (current behavior preserved)
- ON DELETE SET NULL — deleting a category uncategorizes its feeds, doesn't delete them

### Initial data

Categories to create:
1. `{ name: "AI & Tech", slug: "ai-and-tech", type: "youtube" }`
2. `{ name: "DJ Techniques", slug: "dj-techniques", type: "youtube" }`

Backfill: UPDATE all existing YouTube feeds (12) to set `category_id` = AI & Tech category ID.

---

## Scope

### 1.1 Schema + migration
- Create `feed_categories` table in Drizzle schema
- Add `category_id` FK column to `feeds` table
- Run `drizzle-kit push`
- Execute backfill SQL: create "AI & Tech" + "DJ Techniques" categories, assign existing YouTube feeds to "AI & Tech"

### 1.2 Types update
- Add `FeedCategory` interface: `{ id, name, slug, type, isPublic, shareToken, createdAt }`
- Add `categoryId: number | null` to `Feed` interface
- Add `category?: FeedCategory` for joined queries

### 1.3 API: categories CRUD
- `GET /api/categories` — returns all categories, optionally filtered by `?type=youtube`
- `POST /api/categories` — create category (name, type → auto-generate slug from name)
- `PUT /api/categories/[id]` — update name (re-slug)
- `DELETE /api/categories/[id]` — delete category (feeds get category_id = NULL)

### 1.4 API: update existing feed endpoints
- `POST /api/feeds` — accept optional `categoryId` field
- `PUT /api/feeds/[id]` — accept `categoryId` to reassign feed to different category
- `POST /api/feeds/preview-group` — accept optional `categoryId`; when set, only fetch feeds with that category_id instead of all feeds of that type
- `GET /api/feeds` — join category data so frontend has category info without extra call

### 1.5 Sidebar sub-groups

Current:
```
YouTube (12)
  Aakash Gupta - ...
  How I AI - ...
  ...
```

New (when type has categories):
```
YouTube (14)                    ← click = "All YouTube" merged view (unchanged)
  ▾ AI & Tech (12)             ← click name = merged view for this category
    Aakash Gupta - ...          ← click = individual feed detail (unchanged)
    How I AI - ...
    ...
  ▸ DJ Techniques (2)          ← collapsed, click name = merged view
```

**Behavior rules:**
- Source types WITH categories: show 3-level nesting (type → category → feeds)
- Source types WITHOUT categories: show 2-level nesting as today (type → feeds) — zero change
- Mixed state (some feeds categorized, some not): uncategorized feeds show under an "Other" pseudo-group at bottom. Prevents feeds from being invisible.
- Clicking type header → "All [Type]" merged view (existing behavior, unchanged)
- Clicking category name → category merged view (new)
- Clicking category chevron → expand/collapse feed list within that category
- Clicking individual feed → feed detail view (existing behavior, unchanged)
- Empty category (0 feeds) → still shows in sidebar with (0) count

### 1.6 Page state management
- Add `activeCategory: { id: number; slug: string; name: string } | null` state to `page.tsx`
- Fetch categories alongside feeds on mount (or return joined from GET /api/feeds)
- `handleSelectCategory(category)` — sets activeCategory, clears activeFeedId, clears showCreator
- `handleSelectGroup(type)` — clears activeCategory (shows all of type, like today)
- Pass activeCategory to Sidebar (highlighting) and GroupOverview (filtering)

### 1.7 GroupOverview update
- Accept optional `categoryId` and `categoryName` props
- When `categoryId` set: POST to preview-group with `{ type, categoryId }` → backend filters
- Header shows `categoryName` (e.g., "AI & Tech") or "All YouTube" when no category filter
- Feed count reflects filtered count, not total type count

### 1.8 FeedCreator update
- When source type is selected, fetch categories for that type via `GET /api/categories?type=youtube`
- Show "Category" dropdown below the query input:
  - Options: existing categories for this type + "None" + "Create new..."
  - Selecting "Create new..." shows a text input for the new category name
  - New category created on feed save (POST /api/categories then use returned ID)
- Category field is optional — "None" = uncategorized feed
- Only show category dropdown when categories exist for the selected type (News/Reddit/RSS won't show it until someone creates categories for them)

### 1.9 FeedDetail update
- Show current category as a chip/badge next to the type badge (e.g., `[YouTube] [AI & Tech]`)
- Click chip → dropdown to change category (same options as FeedCreator: existing categories + None + Create new)
- Save triggers `PUT /api/feeds/[id]` with new `categoryId`

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Feed has NULL category_id | Shows under "Other" pseudo-group when that type has other categorized feeds. Shows normally (flat list) when no categories exist for that type. |
| Delete category with feeds | Feeds get `category_id = NULL` (ON DELETE SET NULL), appear under "Other" |
| Rename category | Slug auto-regenerates from new name. Show warning: "This may break external links in the future." |
| Empty category (0 feeds) | Stays in sidebar with (0), can be deleted via UI |
| Type with no categories at all | Renders exactly like today — flat feed list, no sub-groups |
| Category slug collision | Append `-2`, `-3` etc. Slug is UNIQUE in DB. |
| Multiple types each have categories | Each type gets its own independent category grouping. A "youtube" category doesn't affect "reddit". |
| Bulk category reassignment | Not needed now — one feed at a time via FeedDetail is sufficient |

---

## Out of Scope (for this PRD)

- Public embed route / iframe support (separate future PRD, builds on this)
- YouTube keyword/search feeds (only channel-based feeds)
- Drag-and-drop feed reordering within categories
- Multi-category assignment (a feed belongs to exactly one category or none)
- Category icons or colors

---

## Task Breakdown

| # | Task | Files | Depends on |
|---|------|-------|------------|
| 1 | Schema: create feed_categories table, add category_id FK to feeds | schema.ts | — |
| 2 | Migration: drizzle-kit push + backfill SQL | CLI + SQL | 1 |
| 3 | Types: add FeedCategory interface, update Feed interface | types/index.ts | 1 |
| 4 | API: categories CRUD (GET, POST, PUT, DELETE) | api/categories/route.ts, api/categories/[id]/route.ts | 1, 3 |
| 5 | API: update GET /api/feeds to join category | api/feeds/route.ts | 1, 3 |
| 6 | API: update POST /api/feeds to accept categoryId | api/feeds/route.ts | 1, 3 |
| 7 | API: update PUT /api/feeds/[id] for categoryId | api/feeds/[id]/route.ts | 1, 3 |
| 8 | API: update preview-group to filter by categoryId | api/feeds/preview-group/route.ts | 1, 3 |
| 9 | Page: add activeCategory state, fetch categories, handlers | page.tsx | 3 |
| 10 | Sidebar: 3-level nesting with category sub-groups | Sidebar.tsx | 9 |
| 11 | GroupOverview: accept categoryId/categoryName, filter display | GroupOverview.tsx | 8, 9 |
| 12 | FeedCreator: add category dropdown + "create new" flow | FeedCreator.tsx | 4, 6 |
| 13 | FeedDetail: show/edit category badge | FeedDetail.tsx | 4, 7 |
| 14 | Backfill: create categories + assign existing YouTube feeds | one-time SQL | 2 |
| 15 | Deploy + browser verify (sidebar, group views, create flow, edit flow) | — | all |

---

## Design Notes

- Brand: Cyan #0891B2, Inter font, Slate neutrals — no changes
- Category slugs: generated via `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`
- Sidebar nesting: max 3 levels (type → category → feeds). No deeper.
- Category dropdown in FeedCreator: simple `<select>` with "Create new..." option that shows inline text input. No modal.
- Category badge in FeedDetail: styled same as the type badge (small rounded pill) but with slightly different color (slate-200/slate-700 bg to distinguish from cyan type badge)
