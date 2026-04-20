"use client";

import { useEffect, useState, useCallback } from "react";
import { ArticleCard } from "./ArticleCard";
import type { FeedType, FeedCategory, PreviewArticle } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  "google-news": "All News",
  youtube: "All YouTube",
  reddit: "All Reddit",
  rss: "All RSS",
};

interface GroupOverviewProps {
  type: FeedType;
  categoryId?: number;
  categoryName?: string;
  category?: FeedCategory | null;
  onCategoryUpdate?: () => void;
}

export function GroupOverview({ type, categoryId, categoryName, category, onCategoryUpdate }: GroupOverviewProps) {
  const [articles, setArticles] = useState<PreviewArticle[]>([]);
  const [feedCount, setFeedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmbedSettings, setShowEmbedSettings] = useState(false);
  const [embedTheme, setEmbedTheme] = useState<"dark" | "light">("dark");
  const [isPublic, setIsPublic] = useState(category?.isPublic ?? false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsPublic(category?.isPublic ?? false);
    setShowEmbedSettings(false);
  }, [category?.id, category?.isPublic]);

  const fetchGroup = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = { type };
      if (categoryId !== undefined) payload.categoryId = categoryId;

      const res = await fetch("/api/feeds/preview-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
  }, [type, categoryId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const togglePublic = async () => {
    if (!category) return;
    const newValue = !isPublic;
    setIsPublic(newValue);
    await fetch(`/api/categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: newValue }),
    });
    onCategoryUpdate?.();
  };

  const embedUrl = category
    ? `https://feedboard-pro.vercel.app/embed/${type}/${category.slug}?theme=${embedTheme}`
    : "";

  const embedSnippet = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-2 py-1 rounded-full">
            {SOURCE_LABELS[type] || type}
          </span>
          {categoryName && (
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
              {categoryName}
            </span>
          )}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex-1">
            {categoryName || SOURCE_LABELS[type] || type}
          </h2>

          {/* Embed settings gear — only for category views */}
          {category && (
            <button
              onClick={() => setShowEmbedSettings(!showEmbedSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showEmbedSettings
                  ? "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Embed settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Embed settings panel */}
        {showEmbedSettings && category && (
          <div className="mb-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Embed Settings</span>
              <button
                onClick={() => setShowEmbedSettings(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">Make embeddable</span>
              <button
                onClick={togglePublic}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  isPublic ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    isPublic ? "left-5.5 translate-x-0" : "left-0.5"
                  }`}
                  style={isPublic ? { left: "22px" } : { left: "2px" }}
                />
              </button>
              <span className={`text-xs font-medium ${isPublic ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`}>
                {isPublic ? "ON" : "OFF"}
              </span>
            </div>

            {isPublic && (
              <>
                {/* Theme selector */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Theme:</span>
                  <button
                    onClick={() => setEmbedTheme("light")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      embedTheme === "light"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-cyan-400 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-transparent"
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setEmbedTheme("dark")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      embedTheme === "dark"
                        ? "bg-slate-800 text-slate-100 border border-cyan-400 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-transparent"
                    }`}
                  >
                    Dark
                  </button>
                </div>

                {/* Embed code */}
                <div className="relative">
                  <textarea
                    readOnly
                    value={embedSnippet}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono resize-none h-16"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Preview link */}
                <div className="mt-2">
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                  >
                    Open preview in new tab ↗
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span>{feedCount} feeds</span>
          <span>Latest 50 articles by date</span>
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
