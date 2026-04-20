import { db } from "@/lib/db";
import { feeds, feedCategories } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { fetchYouTube, resolveChannelId } from "@/lib/parsers/youtube";
import { fetchGoogleNews } from "@/lib/parsers/google-news";
import { fetchReddit } from "@/lib/parsers/reddit";
import { fetchRss } from "@/lib/parsers/rss";
import { EmbedView } from "@/components/EmbedView";
import type { PreviewArticle } from "@/types";

export const dynamic = "force-dynamic";

function ErrorPage({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{message}</p>
    </div>
  );
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ theme?: string; token?: string }>;
}) {
  const { type, slug } = await params;
  const sp = await searchParams;
  const theme = (sp?.theme === "dark" ? "dark" : "light") as "dark" | "light";
  const token = sp?.token as string | undefined;
  const isDark = theme === "dark";

  const [category] = await db
    .select()
    .from(feedCategories)
    .where(and(eq(feedCategories.type, type), eq(feedCategories.slug, slug)))
    .limit(1);

  if (!category) {
    return <ErrorPage message="Feed not found" isDark={isDark} />;
  }

  if (!category.isPublic) {
    return <ErrorPage message="This feed is not public" isDark={isDark} />;
  }

  if (category.shareToken && category.shareToken !== token) {
    return (
      <ErrorPage
        message={!token ? "Access token required" : "Invalid access token"}
        isDark={isDark}
      />
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

  return (
    <EmbedView
      initialArticles={allArticles.slice(0, 50)}
      theme={theme}
      categoryName={category.name}
      feedCount={feedList.length}
      type={type}
      slug={slug}
      token={token}
    />
  );
}
