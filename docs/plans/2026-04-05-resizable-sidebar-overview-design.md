# Resizable Sidebar + Feed Type Overview Pages — Design Doc

**Date:** 2026-04-05
**Status:** Approved

## Problem

1. Sidebar fixed at 260px — feed names with URLs truncated, no way to see full content
2. No combined view across feeds — must click each feed individually to find new content

## Feature 1: Resizable Sidebar

- 4px drag handle on sidebar right edge, `col-resize` cursor
- Drag to resize: min 200px, max 500px
- Persist width in `localStorage` key `feedboard-sidebar-width`
- Subtle visual indicator on hover (cyan border)

## Feature 2: Feed Type Overview Pages

- Click group header label/icon → show combined overview of latest 30 items across all feeds of that type
- Click chevron → expand/collapse individual feed list (existing behavior)
- New API: `POST /api/feeds/preview-group` with `{ type }` → queries all feeds of that type from DB, fetches all in parallel, merges + sorts by publish date desc, returns top 30
- New component: `GroupOverview.tsx` — type badge, "All {Type}" title, feed count, refresh button, article list
- Loading: spinner while fetching, same pattern as FeedDetail
- ArticleCard source field shows which feed/source each item came from

## Out of Scope

- Cross-type "All Feeds" view
- Unread badges
- Background prefetching
- Pagination beyond 30
