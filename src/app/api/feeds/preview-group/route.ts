import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { fetchGoogleNews } from "@/lib/parsers/google-news";
import { fetchYouTube, resolveChannelId } from "@/lib/parsers/youtube";
import { fetchReddit } from "@/lib/parsers/reddit";
import { fetchRss } from "@/lib/parsers/rss";
import type { FeedType, PreviewArticle } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, categoryId } = body as { type: FeedType; categoryId?: number };

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    // Get feeds of this type, optionally filtered by category
    let feedList;
    if (categoryId !== undefined) {
      feedList = await db
        .select()
        .from(feeds)
        .where(and(eq(feeds.type, type), eq(feeds.categoryId, categoryId)));
    } else {
      feedList = await db.select().from(feeds).where(eq(feeds.type, type));
    }

    if (feedList.length === 0) {
      return NextResponse.json({ articles: [], feedCount: 0, type });
    }

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
      feedList.map(async (feed) => {
        switch (type) {
          case "google-news": {
            const result = await fetchGoogleNews(feed.query, feed.language || "en");
            return result.articles;
          }
          case "youtube": {
            const channelId = await resolveChannelId(feed.query);
            const result = await fetchYouTube(channelId);
            return result.articles;
          }
          case "reddit": {
            const result = await fetchReddit(feed.query);
            return result.articles;
          }
          case "rss": {
            const result = await fetchRss(feed.query);
            return result.articles;
          }
          default:
            return [];
        }
      })
    );

    // Merge all successful results
    const allArticles: PreviewArticle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }

    // Sort by publishedAt descending, take top 50
    allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      articles: allArticles.slice(0, 50),
      feedCount: feedList.length,
      type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Group preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
