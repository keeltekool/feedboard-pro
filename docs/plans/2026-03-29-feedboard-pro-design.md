# Feedboard Pro — Design Document

> RSS Feed Design Studio: Build, preview, and manage Google News / YouTube / Reddit RSS feeds.
>
> Date: 2026-03-29

---

## Problem

User (SK ID Solutions) needs to track 26+ niche industry RSS feeds (eIDAS, QTSP, CSC, ETSI, e-seal, EUDI wallet, digital credentials, etc.). rss.app charges $8-83/mo and limits trial accounts to 10 feeds with 6-day expiry. Need a self-hosted alternative with no limits.

## What Feedboard Pro IS

An **RSS feed design studio** — craft RSS feeds by entering keywords or channel names, preview live results with thumbnails, save and organize feeds by source type. A feed creation and management tool.

## What Feedboard Pro is NOT

- Not a real-time news monitor (that's Feedboard / data-tracker)
- Not an article reader/aggregator — preview exists to validate feed quality
- Not a multi-user SaaS — single-user tool

## Relationship to Feedboard (data-tracker)

Same brand family, different tools:
- **Feedboard** = "What's happening NOW?" — real-time pulse, hourly monitoring, time filters
- **Feedboard Pro** = "Build and manage my intelligence feeds" — feed creation, validation, steady content streams

Shared: brand assets (Cyan #0891B2, Inter font, design tokens), Google News RSS parser, card component patterns, dark/light theme.

---

## Core Entities

### Feed
A saved RSS source defined by:
- `name` — user-given name (e.g. "Google News - eIDAS")
- `type` — source type: `google-news` | `youtube` | `reddit`
- `query` — keywords (news/reddit) or channel URL/name (youtube)
- `language` — language code, default "en" (news only)
- `rssUrl` — the generated/resolved RSS URL
- `lastTestedAt` — timestamp of last preview
- `articleCount` — article count from last preview

### Bundle (Phase 2)
A named group that merges multiple feeds into one combined RSS URL.
- `name`, `description`
- Links to N feeds via join table
- API endpoint serves merged RSS XML output

---

## Data Model (PostgreSQL / Neon + Drizzle ORM)

```sql
-- Phase 1
CREATE TABLE feeds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,        -- 'google-news' | 'youtube' | 'reddit'
  query TEXT NOT NULL,               -- keywords or channel URL
  language VARCHAR(10) DEFAULT 'en',
  rss_url TEXT NOT NULL,             -- generated RSS URL
  last_tested_at TIMESTAMP,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Phase 2
CREATE TABLE bundles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bundle_feeds (
  bundle_id INTEGER REFERENCES bundles(id) ON DELETE CASCADE,
  feed_id INTEGER REFERENCES feeds(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (bundle_id, feed_id)
);
```

---

## UX Layout

### Single-Page App with Sidebar + Main Area

#### Left Sidebar (always visible, scrollable)

```
─────────────────────────
  + New Feed

  📰 News (7)            ▾  ← click to collapse/expand
     Google News - eIDAS
     Google News - QTSP
     Google News - CSC
     Google News - e-seal
     Google News - ETSI
     Google News - remote signing
     Google News - timestamping

  🎬 YouTube (3)          ▸  ← collapsed

  💬 Reddit (2)           ▸  ← collapsed

─────────────────────────
```

- Feeds grouped by **source type** (accordion, click-open/click-close)
- Feed count badge per section
- Active feed highlighted in cyan
- Source-appropriate icons per section

#### Main Area — Feed Selected

- **Header:** Feed name + source icon + source RSS URL underneath
- **Live article preview:** Scrollable list of article cards with:
  - **Thumbnail** (news image, YouTube video thumb, Reddit post image)
  - Title (clickable, opens in new tab)
  - Description/snippet
  - Source name + publish date
- **Feed metadata:** Keywords/query, RSS URL with copy button, created date, article count, status
- **Actions:** Edit, Delete

#### Main Area — Create New Feed

- **Source type selector:** News / YouTube / Reddit (tabs or buttons)
- **Input adapts per source:**
  - News: keyword field (single or combined) + language picker
  - YouTube: channel name or URL (we resolve channel ID behind the scenes)
  - Reddit: subreddit name or search keywords
- **"Preview" button** → fetches live, shows article cards with thumbnails
- See results → tweak input → preview again
- **"Save Feed" button** + name field → saves, appears in sidebar under correct source section

---

## RSS Source Details

| Source | RSS URL Pattern | Input | Thumbnails |
|--------|----------------|-------|------------|
| **Google News** | `news.google.com/rss/search?q={keywords}&hl={lang}` | Keywords + language | Yes — `<media:content>` |
| **YouTube** | `youtube.com/feeds/videos.xml?channel_id={id}` | Channel name or URL → resolve ID | Yes — `<media:thumbnail>` |
| **Reddit** | `reddit.com/r/{sub}.rss` or `reddit.com/search.rss?q={keywords}` | Subreddit name or keywords | Yes — embedded in `<content>` HTML |

### YouTube Channel ID Resolution
User inputs channel name or URL (e.g. `youtube.com/@FIDOAlliance` or "FIDO Alliance"). We resolve the actual channel ID behind the scenes — users never see the jibberish ID string.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Framework** | Next.js 16 |
| **Database** | Neon PostgreSQL + Drizzle ORM |
| **Styling** | Tailwind CSS 4 + Feedboard brand system |
| **RSS Parsing** | Custom parsers (port from Feedboard + new YouTube/Reddit) |
| **Hosting** | Vercel |
| **Project dir** | `C:\Users\Kasutaja\Claude_Projects\feedboard-pro` |

### Ported from Feedboard (data-tracker)
- Brand assets: logos, favicons, design tokens, Tailwind config
- Google News RSS parser (`google-news.ts`)
- Card component patterns
- Dark/light theme toggle
- Inter font, Cyan #0891B2 color system

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/feeds` | GET | List all feeds |
| `/api/feeds` | POST | Create new feed |
| `/api/feeds/[id]` | GET | Get feed details |
| `/api/feeds/[id]` | PUT | Update feed |
| `/api/feeds/[id]` | DELETE | Delete feed |
| `/api/feeds/preview` | POST | Preview: takes type + query, fetches RSS live, returns articles (no save) |
| `/api/youtube/resolve` | POST | Resolve YouTube channel name/URL to channel ID |
| Phase 2: `/api/bundles/*` | * | Bundle CRUD + merged RSS output |

---

## Phasing

### Phase 1 — MVP
- Feed builder with 3 sources (Google News, YouTube, Reddit)
- Live preview with thumbnails
- Save, name, edit, delete feeds
- Sidebar with collapsible source-type sections
- Feed detail view with live article preview
- RSS URL display with copy button
- Dark/light theme
- Deploy to Vercel

### Phase 2 — Bundles + Polish
- Bundles: merge multiple feeds into one RSS URL
- Bundle CRUD + `/api/bundles/[id]/rss` endpoint
- Drag feeds into bundles

### Phase 3 — Website Scraping
- "Any URL to RSS" — scrape websites without native RSS
- Pluggable source architecture (add new source types)
- Filters: whitelist/blacklist keywords

---

## NOT Building (Out of Scope)
- User authentication / multi-user
- Article reading/aggregation experience
- Bots & alerts (Slack/Discord/email)
- Widgets / embeds
- Feed translation
- Collections (manual curation)
- API access for external consumers
