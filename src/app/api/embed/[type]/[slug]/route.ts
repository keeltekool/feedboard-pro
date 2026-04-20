import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds, feedCategories } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { fetchYouTube, resolveChannelId } from "@/lib/parsers/youtube";
import { fetchGoogleNews } from "@/lib/parsers/google-news";
import { fetchReddit } from "@/lib/parsers/reddit";
import { fetchRss } from "@/lib/parsers/rss";
import type { PreviewArticle } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/embed/[type]/[slug]">
) {
  try {
    const { type, slug } = await ctx.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const [category] = await db
      .select()
      .from(feedCategories)
      .where(and(eq(feedCategories.type, type), eq(feedCategories.slug, slug)))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    if (!category.isPublic) {
      return NextResponse.json({ error: "This feed is not public" }, { status: 403 });
    }

    if (category.shareToken && category.shareToken !== token) {
      return NextResponse.json(
        { error: category.shareToken && !token ? "Access token required" : "Invalid access token" },
        { status: 403 }
      );
    }

    const feedList = await db
      .select()
      .from(feeds)
      .where(eq(feeds.categoryId, category.id));

    const results = await Promise.allSettled(
      feedList.map(async (feed) => {
        switch (feed.type) {
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

    const allArticles: PreviewArticle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }

    allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    const response = NextResponse.json({
      articles: allArticles.slice(0, 50),
      categoryName: category.name,
      feedCount: feedList.length,
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Embed fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
