import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds, feedCategories } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        feed: feeds,
        category: feedCategories,
      })
      .from(feeds)
      .leftJoin(feedCategories, eq(feeds.categoryId, feedCategories.id))
      .orderBy(desc(feeds.createdAt));

    const allFeeds = rows.map((row) => ({
      ...row.feed,
      category: row.category || null,
    }));

    return NextResponse.json({ feeds: allFeeds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch feeds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, query, language, rssUrl, articleCount, categoryId } = body;

    if (!name || !type || !query || !rssUrl) {
      return NextResponse.json(
        { error: "name, type, query, and rssUrl are required" },
        { status: 400 }
      );
    }

    if (categoryId) {
      const [cat] = await db
        .select({ id: feedCategories.id })
        .from(feedCategories)
        .where(eq(feedCategories.id, Number(categoryId)))
        .limit(1);
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
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
        categoryId: categoryId ? Number(categoryId) : null,
        lastTestedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ feed: newFeed }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
