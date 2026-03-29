import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/feeds/[id]">
) {
  try {
    const { id } = await ctx.params;
    const [feed] = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, Number(id)));

    if (!feed) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    return NextResponse.json({ feed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/feeds/[id]">
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    const [updated] = await db
      .update(feeds)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    return NextResponse.json({ feed: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/feeds/[id]">
) {
  try {
    const { id } = await ctx.params;

    const [deleted] = await db
      .delete(feeds)
      .where(eq(feeds.id, Number(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
