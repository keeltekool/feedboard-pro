export type FeedType = "google-news" | "youtube" | "reddit";

export interface Feed {
  id: number;
  name: string;
  type: FeedType;
  query: string;
  language: string | null;
  rssUrl: string;
  lastTestedAt: Date | null;
  articleCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreviewArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  thumbnail?: string;
  description?: string;
}

export interface PreviewResponse {
  articles: PreviewArticle[];
  rssUrl: string;
  articleCount: number;
  error?: string;
}

export interface FeedsResponse {
  feeds: Feed[];
  error?: string;
}
