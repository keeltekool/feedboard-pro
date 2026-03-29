import { NextResponse } from "next/server";
import { fetchGoogleNews } from "@/lib/parsers/google-news";
import { fetchYouTube, resolveChannelId } from "@/lib/parsers/youtube";
import { fetchReddit } from "@/lib/parsers/reddit";
import type { FeedType } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, query, language = "en" } = body as {
      type: FeedType;
      query: string;
      language?: string;
    };

    if (!type || !query) {
      return NextResponse.json(
        { error: "type and query are required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "google-news": {
        const result = await fetchGoogleNews(query, language);
        return NextResponse.json({
          articles: result.articles,
          rssUrl: result.rssUrl,
          articleCount: result.articles.length,
        });
      }

      case "youtube": {
        const channelId = await resolveChannelId(query);
        const result = await fetchYouTube(channelId);
        return NextResponse.json({
          articles: result.articles,
          rssUrl: result.rssUrl,
          articleCount: result.articles.length,
          channelName: result.channelName,
        });
      }

      case "reddit": {
        const result = await fetchReddit(query);
        return NextResponse.json({
          articles: result.articles,
          rssUrl: result.rssUrl,
          articleCount: result.articles.length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported feed type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
