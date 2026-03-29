"use client";

import { useState } from "react";
import type { Feed } from "@/types";

const SOURCE_CONFIG = {
  "google-news": {
    label: "News",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  reddit: {
    label: "Reddit",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
} as const;

interface SidebarProps {
  feeds: Feed[];
  activeFeedId: number | null;
  onSelectFeed: (id: number) => void;
  onNewFeed: () => void;
}

export function Sidebar({ feeds, activeFeedId, onSelectFeed, onNewFeed }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "google-news": true,
    youtube: true,
    reddit: true,
  });

  const grouped = feeds.reduce(
    (acc, feed) => {
      const key = feed.type as keyof typeof SOURCE_CONFIG;
      if (!acc[key]) acc[key] = [];
      acc[key].push(feed);
      return acc;
    },
    {} as Record<string, Feed[]>
  );

  const toggleSection = (type: string) => {
    setExpanded((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <aside className="w-[260px] shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden">
      <div className="p-4">
        <button
          onClick={onNewFeed}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Feed
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {(Object.keys(SOURCE_CONFIG) as Array<keyof typeof SOURCE_CONFIG>).map((type) => {
          const config = SOURCE_CONFIG[type];
          const typeFeeds = grouped[type] || [];

          return (
            <div key={type} className="mb-1">
              <button
                onClick={() => toggleSection(type)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-500 dark:text-slate-400">{config.icon}</span>
                <span className="flex-1 text-left">{config.label}</span>
                {typeFeeds.length > 0 && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                    {typeFeeds.length}
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded[type] ? "rotate-0" : "-rotate-90"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded[type] && typeFeeds.length > 0 && (
                <div className="ml-2 mt-0.5 space-y-0.5">
                  {typeFeeds.map((feed) => (
                    <button
                      key={feed.id}
                      onClick={() => onSelectFeed(feed.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm truncate transition-colors ${
                        activeFeedId === feed.id
                          ? "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {feed.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {feeds.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No feeds yet. Create your first feed to get started.
          </div>
        )}
      </nav>
    </aside>
  );
}
