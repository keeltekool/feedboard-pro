"use client";

import { useEffect, useState, useCallback } from "react";
import { ArticleCard } from "./ArticleCard";
import type { Feed, PreviewArticle } from "@/types";

interface FeedDetailProps {
  feed: Feed;
  onDelete: () => void;
  onUpdate: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  "google-news": "Google News",
  youtube: "YouTube",
  reddit: "Reddit",
  rss: "RSS",
};

export function FeedDetail({ feed, onDelete, onUpdate }: FeedDetailProps) {
  const [articles, setArticles] = useState<PreviewArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(feed.name);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/feeds/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feed.type,
          query: feed.query,
          language: feed.language,
        }),
      });
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch {
      // Silently fail — show empty state
    } finally {
      setIsLoading(false);
    }
  }, [feed.type, feed.query, feed.language]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  useEffect(() => {
    setEditName(feed.name);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [feed.id, feed.name]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feed.rssUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRename = async () => {
    if (!editName.trim() || editName === feed.name) {
      setIsEditing(false);
      return;
    }

    await fetch(`/api/feeds/${feed.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });

    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    await fetch(`/api/feeds/${feed.id}`, { method: "DELETE" });
    onDelete();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-2 py-1 rounded-full">
            {SOURCE_LABELS[feed.type] || feed.type}
          </span>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-lg font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                onClick={handleRename}
                className="px-3 py-1.5 rounded-md bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditName(feed.name); }}
                className="px-3 py-1.5 rounded-md text-slate-500 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex-1">
              {feed.name}
            </h2>
          )}

          {!isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit name"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Delete feed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
            <span className="text-sm text-red-600 dark:text-red-400">Delete this feed?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* RSS URL */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={feed.rssUrl}
            readOnly
            className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Metadata */}
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span>Query: <strong className="text-slate-600 dark:text-slate-300">{feed.query}</strong></span>
          {feed.language && <span>Language: <strong className="text-slate-600 dark:text-slate-300">{feed.language}</strong></span>}
          <span>{feed.articleCount} articles</span>
        </div>

        {/* Refresh */}
        <div className="mt-3">
          <button
            onClick={fetchPreview}
            disabled={isLoading}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
          >
            {isLoading ? "Refreshing..." : "Refresh Preview"}
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
            No articles found for this feed.
          </div>
        )}
      </div>
    </div>
  );
}
