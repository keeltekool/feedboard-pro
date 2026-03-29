"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { PreviewArticle } from "@/types";

interface ArticleCardProps {
  article: PreviewArticle;
}

function isGoogleNewsUrl(url: string): boolean {
  return url.includes("news.google.com/rss/articles");
}

function getSourceDomain(source: string, url: string): string {
  // For Google News, source is already the publisher name/domain
  if (source && source !== "unknown") {
    return source.replace(/\s+/g, "").toLowerCase();
  }
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [thumbnail, setThumbnail] = useState(article.thumbnail || null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (article.thumbnail || thumbnail) return;
    // Don't try to fetch og:image for Google News redirect URLs
    if (isGoogleNewsUrl(article.url)) return;

    let cancelled = false;
    fetch(`/api/og-image?url=${encodeURIComponent(article.url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.image) setThumbnail(data.image);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [article.url, article.thumbnail, thumbnail]);

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  const domain = getSourceDomain(article.source, article.url);
  const showFavicon = !thumbnail || imgError;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all"
    >
      {thumbnail && !imgError ? (
        <div className="shrink-0 w-[140px] h-[90px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      ) : showFavicon ? (
        <div className="shrink-0 w-[140px] h-[90px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-300 text-lg font-bold uppercase">
            {domain.charAt(0)}
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 line-clamp-2 transition-colors">
          {article.title}
        </h3>

        {article.description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {article.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {article.source}
          </span>
          {timeAgo && (
            <>
              <span>·</span>
              <span>{timeAgo}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
