"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { PreviewArticle } from "@/types";

interface EmbedViewProps {
  initialArticles: PreviewArticle[];
  theme: "dark" | "light";
  categoryName: string;
  feedCount: number;
  type: string;
  slug: string;
  token?: string;
}

function EmbedCard({ article, theme }: { article: PreviewArticle; theme: "dark" | "light" }) {
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  const isDark = theme === "dark";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex gap-3 p-3 rounded-lg border transition-colors ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:border-cyan-700"
          : "bg-white border-slate-200 hover:border-cyan-300"
      }`}
    >
      {article.thumbnail && (
        <div className="shrink-0 w-[100px] h-[65px] rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700">
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3
          className={`text-sm font-medium line-clamp-2 transition-colors ${
            isDark
              ? "text-slate-100 group-hover:text-cyan-400"
              : "text-slate-900 group-hover:text-cyan-600"
          }`}
        >
          {article.title}
        </h3>
        <div className={`mt-1 flex items-center gap-1.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
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

export function EmbedView({
  initialArticles,
  theme,
  categoryName,
  feedCount,
  type,
  slug,
  token,
}: EmbedViewProps) {
  const [articles, setArticles] = useState(initialArticles);
  const isDark = theme === "dark";

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams();
        if (token) params.set("token", token);
        const res = await fetch(`/api/embed/${type}/${slug}?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.articles) setArticles(data.articles);
        }
      } catch {
        // Keep existing articles on failure
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [type, slug, token]);

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      style={isDark ? { scrollbarWidth: "thin", scrollbarColor: "#334155 #0f172a" } : undefined}
    >
      {/* Header */}
      <div className={`px-4 pt-4 pb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
        <h1 className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          {categoryName}
        </h1>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {feedCount} {feedCount === 1 ? "feed" : "feeds"} · Updated every 5 min
        </p>
      </div>

      {/* Articles */}
      <div className="px-4 pb-4 space-y-2">
        {articles.length > 0 ? (
          articles.map((article) => (
            <EmbedCard key={article.id} article={article} theme={theme} />
          ))
        ) : (
          <div className={`text-center py-12 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            No content available
          </div>
        )}
      </div>

      {/* Watermark */}
      <div className={`px-4 pb-4 text-center text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>
        Powered by{" "}
        <a
          href="https://feedboard-pro.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:underline ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Feedboard Pro
        </a>
      </div>
    </div>
  );
}
