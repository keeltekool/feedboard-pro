import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function backfill() {
  // Insert categories
  const categories = await sql`
    INSERT INTO feed_categories (name, slug, type, is_public)
    VALUES
      ('AI & Tech', 'ai-and-tech', 'youtube', false),
      ('DJ Techniques', 'dj-techniques', 'youtube', false)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, name, slug
  `;
  console.log("Created categories:", categories);

  const aiCategory = categories.find((c) => c.slug === "ai-and-tech");
  if (aiCategory) {
    const updated = await sql`
      UPDATE feeds SET category_id = ${aiCategory.id} WHERE type = 'youtube' AND category_id IS NULL
    `;
    console.log("Updated YouTube feeds to AI & Tech:", updated);
  }

  // Verify
  const allFeeds = await sql`SELECT id, name, type, category_id FROM feeds ORDER BY id`;
  console.log("All feeds:", allFeeds);

  const allCategories = await sql`SELECT * FROM feed_categories ORDER BY id`;
  console.log("All categories:", allCategories);
}

backfill().catch(console.error);
