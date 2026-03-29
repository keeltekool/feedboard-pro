"use client";

import { formatDistanceToNow } from "date-fns";
import type { PreviewArticle } from "@/types";

interface ArticleCardProps {
  article: PreviewArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all"
    >
      {article.thumbnail && (
        <div className="shrink-0 w-[140px] h-[90px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

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
