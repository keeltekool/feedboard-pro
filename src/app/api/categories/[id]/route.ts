import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedCategories, feeds } from "@/lib/schema";
import { eq } from "drizzle-orm";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, excludeId: number): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await db
      .select({ id: feedCategories.id })
      .from(feedCategories)
      .where(eq(feedCategories.slug, slug))
      .limit(1);
    if (existing.length === 0 || existing[0].id === excludeId) return slug;
    slug = `${base}-${suffix}`;
    suffix++;
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/categories/[id]">
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const { name } = body as { name?: string };

    const updates: Record<string, unknown> = {};
    if (name) {
      updates.name = name;
      updates.slug = await uniqueSlug(generateSlug(name), Number(id));
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(feedCategories)
      .set(updates)
      .where(eq(feedCategories.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/categories/[id]">
) {
  try {
    const { id } = await ctx.params;
    const numId = Number(id);

    await db
      .update(feeds)
      .set({ categoryId: null })
      .where(eq(feeds.categoryId, numId));

    const [deleted] = await db
      .delete(feedCategories)
      .where(eq(feedCategories.id, numId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
