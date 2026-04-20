import { pgTable, serial, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const feedCategories = pgTable("feed_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  shareToken: varchar("share_token", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  query: text("query").notNull(),
  language: varchar("language", { length: 10 }).default("en"),
  rssUrl: text("rss_url").notNull(),
  categoryId: integer("category_id"),
  lastTestedAt: timestamp("last_tested_at"),
  articleCount: integer("article_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FeedCategory = typeof feedCategories.$inferSelect;
export type NewFeedCategory = typeof feedCategories.$inferInsert;
export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
