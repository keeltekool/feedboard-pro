"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Feed, FeedType } from "@/types";

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
  rss: {
    label: "RSS",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M7 19a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  },
} as const;

interface SidebarProps {
  feeds: Feed[];
  activeFeedId: number | null;
  activeGroupType: FeedType | null;
  onSelectFeed: (id: number) => void;
  onSelectGroup: (type: FeedType) => void;
  onNewFeed: () => void;
}

const SIDEBAR_WIDTH_KEY = "feedboard-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function Sidebar({ feeds, activeFeedId, activeGroupType, onSelectFeed, onSelectGroup, onNewFeed }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "google-news": true,
    youtube: true,
    reddit: true,
    rss: true,
  });

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Load saved width from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) setWidth(parsed);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Save on drag end
      setWidth((w) => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w));
        return w;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

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

  const handleGroupClick = (type: FeedType) => {
    // Expand the section and show overview
    setExpanded((prev) => ({ ...prev, [type]: true }));
    onSelectGroup(type);
  };

  return (
    <aside
      ref={sidebarRef}
      className="shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden relative"
      style={{ width }}
    >
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
          const isGroupActive = activeGroupType === type && activeFeedId === null;

          return (
            <div key={type} className="mb-1">
              <div className="flex items-center">
                {/* Group label — click to show overview */}
                <button
                  onClick={() => handleGroupClick(type)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-l-lg text-sm font-medium transition-colors ${
                    isGroupActive
                      ? "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className={isGroupActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"}>{config.icon}</span>
                  <span className="flex-1 text-left">{config.label}</span>
                  {typeFeeds.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isGroupActive
                        ? "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      {typeFeeds.length}
                    </span>
                  )}
                </button>
                {/* Chevron — click to expand/collapse */}
                <button
                  onClick={() => toggleSection(type)}
                  className="px-2 py-2 rounded-r-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${expanded[type] ? "rotate-0" : "-rotate-90"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

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

      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-400/50 active:bg-cyan-500/50 transition-colors"
      />
    </aside>
  );
}
