import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await db
      .select({ id: feedCategories.id })
      .from(feedCategories)
      .where(eq(feedCategories.slug, slug))
      .limit(1);
    if (existing.length === 0) return slug;
    slug = `${base}-${suffix}`;
    suffix++;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let categories;
    if (type) {
      categories = await db
        .select()
        .from(feedCategories)
        .where(eq(feedCategories.type, type));
    } else {
      categories = await db.select().from(feedCategories);
    }

    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type } = body as { name: string; type: string };

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(generateSlug(name));

    const [category] = await db
      .insert(feedCategories)
      .values({ name, slug, type })
      .returning();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
