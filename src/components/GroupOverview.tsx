"use client";

import { useEffect, useState, useCallback } from "react";
import { ArticleCard } from "./ArticleCard";
import type { FeedType, PreviewArticle } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  "google-news": "All News",
  youtube: "All YouTube",
  reddit: "All Reddit",
  rss: "All RSS",
};

interface GroupOverviewProps {
  type: FeedType;
}

export function GroupOverview({ type }: GroupOverviewProps) {
  const [articles, setArticles] = useState<PreviewArticle[]>([]);
  const [feedCount, setFeedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/feeds/preview-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        setFeedCount(data.feedCount || 0);
      }
    } catch {
      // Silently fail — show empty state
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-2 py-1 rounded-full">
            {SOURCE_LABELS[type] || type}
          </span>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex-1">
            {SOURCE_LABELS[type] || type}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span>{feedCount} feeds</span>
          <span>Latest 30 articles by date</span>
        </div>

        <div className="mt-3">
          <button
            onClick={fetchGroup}
            disabled={isLoading}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Articles */}
      <div className="p-6 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-8 h-8 animate-spin text-cyan-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
            No articles found across feeds.
          </div>
        )}
      </div>
    </div>
  );
}
