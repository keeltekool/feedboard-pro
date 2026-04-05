# Resizable Sidebar + Feed Type Overview — Implementation Plan

**Date:** 2026-04-05
**Design:** [resizable-sidebar-overview-design.md](2026-04-05-resizable-sidebar-overview-design.md)

---

## Phase 1: Resizable Sidebar (Tasks 1-2)

### Task 1: Add drag handle and resize logic to Sidebar
**File:** `src/components/Sidebar.tsx`
- Add a 4px-wide div on the right edge of the sidebar (`absolute right-0 top-0 h-full`)
- Cursor: `col-resize`, hover highlight: cyan border
- `onMouseDown` starts tracking, `mousemove` updates width, `mouseup` stops
- Clamp width between 200px and 500px
- Read initial width from `localStorage('feedboard-sidebar-width')`, default 260
- Save width to localStorage on drag end
- Pass width as inline style instead of fixed `w-[260px]`

### Task 2: Wire sidebar width into page layout
**File:** `src/app/page.tsx`
- Sidebar width may need to be lifted to page.tsx if sidebar doesn't control its own width
- Ensure main content area adjusts (flex layout should handle this automatically)

---

## Phase 2: Overview API (Task 3)

### Task 3: Create preview-group API endpoint
**File:** `src/app/api/feeds/preview-group/route.ts` (NEW)
- Accept `POST { type: FeedType }`
- Query DB: `SELECT * FROM feeds WHERE type = ?`
- For each feed, call the appropriate parser (reuse existing fetchGoogleNews/fetchYouTube/fetchReddit/fetchRss)
- Use `Promise.allSettled()` to fetch all in parallel (don't fail if one feed errors)
- Merge all articles into one array
- Sort by `publishedAt` descending (parse dates for comparison)
- Return top 30: `{ articles, feedCount, type }`

---

## Phase 3: Overview UI (Tasks 4-5)

### Task 4: Create GroupOverview component
**File:** `src/components/GroupOverview.tsx` (NEW)
- Props: `type: FeedType`, `feeds: Feed[]`, `onBack: () => void`
- On mount: `POST /api/feeds/preview-group` with type
- Header: type badge + "All {Type}" title + "{N} feeds" count + Refresh button
- Body: ArticleCard list (same as FeedDetail)
- Loading/empty states same pattern as FeedDetail

### Task 5: Wire overview into page state and sidebar
**Files:** `src/app/page.tsx`, `src/components/Sidebar.tsx`
- Add new view state: `activeView: 'creator' | 'feed' | 'group-overview'`
- Add `activeGroupType: FeedType | null` state
- Sidebar: split group header into two click targets:
  - Label/icon area → `onSelectGroup(type)` → shows GroupOverview
  - Chevron → toggles expand/collapse (existing behavior)
- Sidebar: highlight active group header when in overview mode
- Pass `onSelectGroup` callback from page to sidebar

---

## Checkpoint: Visual Verification

After all tasks:
1. Drag sidebar wider/narrower, verify it persists on reload
2. Click "YouTube" label → verify combined view with 30 items sorted by date
3. Click chevron → verify expand/collapse still works independently
4. Click individual feed → verify FeedDetail still works
5. Test with RSS group (1 feed) and YouTube group (12 feeds)
6. Verify loading spinner during group fetch

---

## Task 6: Deploy + Smoke Test
- `vercel --prod`
- Verify both features on live URL
