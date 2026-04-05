"use client";

import { useState } from "react";
import { ArticleCard } from "./ArticleCard";
import type { FeedType, PreviewArticle } from "@/types";

const SOURCE_TABS: { type: FeedType; label: string }[] = [
  { type: "google-news", label: "News" },
  { type: "youtube", label: "YouTube" },
  { type: "reddit", label: "Reddit" },
  { type: "rss", label: "RSS" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "et", label: "Estonian" },
  { code: "fi", label: "Finnish" },
  { code: "sv", label: "Swedish" },
];

interface FeedCreatorProps {
  onFeedSaved: () => void;
}

export function FeedCreator({ onFeedSaved }: FeedCreatorProps) {
  const [sourceType, setSourceType] = useState<FeedType>("google-news");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [previewArticles, setPreviewArticles] = useState<PreviewArticle[]>([]);
  const [previewRssUrl, setPreviewRssUrl] = useState("");
  const [articleCount, setArticleCount] = useState(0);
  const [feedName, setFeedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasPreview, setHasPreview] = useState(false);

  const handlePreview = async () => {
    if (!query.trim()) return;
    if (sourceType === "rss" && !/^https?:\/\/.+/i.test(query.trim())) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setIsLoading(true);
    setError("");
    setHasPreview(false);

    try {
      const res = await fetch("/api/feeds/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: sourceType, query: query.trim(), language }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setPreviewArticles(data.articles);
      setPreviewRssUrl(data.rssUrl);
      setArticleCount(data.articleCount);
      setHasPreview(true);

      if (!feedName) {
        if (sourceType === "rss") {
          setFeedName(data.feedTitle || query.trim());
        } else {
          const prefix =
            sourceType === "google-news"
              ? "Google News"
              : sourceType === "youtube"
                ? data.channelName || "YouTube"
                : "Reddit";
          setFeedName(`${prefix} - ${query.trim()}`);
        }
      }
    } catch {
      setError("Failed to fetch preview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!feedName.trim() || !previewRssUrl) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedName.trim(),
          type: sourceType,
          query: query.trim(),
          language,
          rssUrl: previewRssUrl,
          articleCount,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setQuery("");
      setFeedName("");
      setPreviewArticles([]);
      setPreviewRssUrl("");
      setHasPreview(false);
      onFeedSaved();
    } catch {
      setError("Failed to save feed.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPlaceholder = () => {
    switch (sourceType) {
      case "google-news":
        return 'Enter keywords, e.g. "eIDAS regulation"';
      case "youtube":
        return "Enter channel name or URL, e.g. @mkbhd";
      case "reddit":
        return 'Enter subreddit or keywords, e.g. "r/technology"';
      case "rss":
        return "Enter RSS feed URL, e.g. https://example.com/feed.xml";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Create New Feed
      </h2>

      {/* Source type tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => {
              setSourceType(tab.type);
              setHasPreview(false);
              setPreviewArticles([]);
              setError("");
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              sourceType === tab.type
                ? "border-cyan-600 text-cyan-600 dark:text-cyan-400 dark:border-cyan-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePreview()}
          placeholder={getPlaceholder()}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />

        {sourceType === "google-news" && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handlePreview}
          disabled={!query.trim() || isLoading}
          className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            "Preview"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Preview results */}
      {hasPreview && (
        <div>
          {/* Save bar */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-2 py-1 rounded-full">
              {articleCount} articles
            </span>
            <input
              type="text"
              value={feedName}
              onChange={(e) => setFeedName(e.target.value)}
              placeholder="Feed name..."
              className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={handleSave}
              disabled={!feedName.trim() || isSaving}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
            >
              {isSaving ? "Saving..." : "Save Feed"}
            </button>
          </div>

          {/* Articles */}
          <div className="space-y-3">
            {previewArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
