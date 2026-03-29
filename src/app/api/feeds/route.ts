import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allFeeds = await db.select().from(feeds).orderBy(desc(feeds.createdAt));
    return NextResponse.json({ feeds: allFeeds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch feeds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, query, language, rssUrl, articleCount } = body;

    if (!name || !type || !query || !rssUrl) {
      return NextResponse.json(
        { error: "name, type, query, and rssUrl are required" },
        { status: 400 }
      );
    }

    const [newFeed] = await db
      .insert(feeds)
      .values({
        name,
        type,
        query,
        language: language || "en",
        rssUrl,
        articleCount: articleCount || 0,
        lastTestedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ feed: newFeed }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
