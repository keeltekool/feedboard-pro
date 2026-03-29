import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  query: text("query").notNull(),
  language: varchar("language", { length: 10 }).default("en"),
  rssUrl: text("rss_url").notNull(),
  lastTestedAt: timestamp("last_tested_at"),
  articleCount: integer("article_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
