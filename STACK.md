# Feedboard Pro — Stack & Services

> **Purpose:** RSS feed design studio replacing rss.app ($8-83/mo). Create Google News / YouTube / Reddit feeds from keywords/channels, preview articles, save and organize feeds.
>
> Last updated: 2026-04-20

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.1 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | Neon PostgreSQL (serverless) | — |
| ORM | Drizzle | 0.41.x |
| Hosting | Vercel | — |
| Repo | [keeltekool/feedboard-pro](https://github.com/keeltekool/feedboard-pro) | — |

---

## Services

| Service | Purpose | Account |
|---------|---------|---------|
| Neon | PostgreSQL database (feeds table) | egertv@gmail.com |
| Vercel | Hosting + serverless API routes | egertv1s |
| GitHub | Source control | keeltekool |

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `.env.local` + Vercel | Neon PostgreSQL connection string |

---

## Key Architecture Decisions

- **Custom XML parsers** — regex-based RSS/Atom parsing (no DOM parser dependency). See `src/lib/parsers/`.
- **No auth** — personal tool, no user accounts needed.
- **Client-side theme** — class-based dark mode via `localStorage` key `feedboard-pro-theme`.
- **YouTube channel resolution** — scrapes YouTube page HTML to resolve `@handle` → `UC...` channel ID.
- **Feed categories** — `feed_categories` table groups feeds by topic within source types. YouTube has "AI & Tech" and "DJ Techniques". Sidebar renders 3-level nesting (type → category → feeds) when categories exist for a type.
- **Public embed** — `/embed/[type]/[slug]` route renders a category's merged feed iframe-safe. Separate layout (no app chrome). `is_public` toggle per category. Optional `share_token` for unlisted access. Auto-refreshes every 5 min via client-side interval.

---

## Gotchas

| Gotcha | Fix |
|--------|-----|
| Tailwind v4 dark mode | Requires `@custom-variant dark (&:where(.dark, .dark *));` in globals.css for class-based toggle |
| `dotenv/config` reads `.env` not `.env.local` | `drizzle.config.ts` needs `.env` file with DATABASE_URL for `drizzle-kit push` |
| Google News descriptions contain raw HTML | Use `cleanDescription()` — strip tags, decode entities including `&nbsp;` |
| YouTube EU consent redirect | EU-based servers get consent page redirect; works with proper User-Agent headers |
| Next.js 16 route params | `params` is a `Promise` — must `await ctx.params` in route handlers |
| Next.js 16 page props | Page components use `{ params: Promise<...>, searchParams: Promise<...> }`, NOT `RouteContext` (that's for API routes only) |
| Embed layout isolation | `/embed` has its own `layout.tsx` — must import globals.css and Inter font independently from main layout |

---

## URLs

- **Live:** https://feedboard-pro.vercel.app
- **Repo:** https://github.com/keeltekool/feedboard-pro
- **Dev:** http://localhost:3099

---

## Brand

- **Primary:** Cyan #0891B2
- **Font:** Inter
- **Neutrals:** Slate scale
- **Dark mode:** Slate 900 bg, Slate 800 cards
