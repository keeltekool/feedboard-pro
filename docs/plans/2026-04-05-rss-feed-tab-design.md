# RSS Feed Tab — Design Doc

**Date:** 2026-04-05
**Status:** Approved

## Problem

Feedboard PRO supports Google News, YouTube, and Reddit feeds but not arbitrary RSS/Atom feeds. Users can't add blogs, podcasts, newsletters, or niche sites.

## Solution

Add a generic **RSS** tab to Create New Feed. User pastes any RSS or Atom feed URL → preview → save. Same flow as existing feed types.

## Data Model — No Migration

- `type`: `"rss"` (varchar(50), no constraint)
- `query`: stores the feed URL
- `language`: unused, `null`
- `rss_url`: same as `query`

## Parser: `src/lib/parsers/rss.ts`

- Fetch URL with 10s timeout
- Auto-detect: `<rss` = RSS 2.0, `<feed` = Atom
- RSS 2.0: parse `<item>` → title, link, pubDate, description, media/enclosure thumbnail
- Atom: parse `<entry>` → title, link[href], updated/published, summary/content, media thumbnail
- Extract feed-level `<title>` for auto-naming
- Use existing shared.ts utilities
- Strip HTML, truncate 200 chars, cap 50 items
- Thumbnail chain: media:content → media:thumbnail → enclosure[type=image] → img in description → og:image fallback

## UI Changes

- **FeedCreator**: 4th tab "RSS", single URL input field, no language dropdown
- **Sidebar**: RSS group after Reddit, RSS icon + count badge
- **FeedDetail**: minor — handle RSS type label display
- **ArticleCard**: no changes (already generic)

## Error Handling

- Invalid URL → client-side validation
- Fetch fail → "Could not fetch feed. Check the URL and try again."
- Not RSS/Atom → "This URL doesn't appear to be an RSS or Atom feed."

## Out of Scope

- RSS auto-discovery from page URLs
- OPML import
- Polling/scheduling
- Favicon fetching
