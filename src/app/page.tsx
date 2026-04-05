"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Sidebar";
import { FeedCreator } from "@/components/FeedCreator";
import { FeedDetail } from "@/components/FeedDetail";
import { GroupOverview } from "@/components/GroupOverview";
import type { Feed, FeedType } from "@/types";

export default function Home() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [activeFeedId, setActiveFeedId] = useState<number | null>(null);
  const [activeGroupType, setActiveGroupType] = useState<FeedType | null>(null);
  const [showCreator, setShowCreator] = useState(true);

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch("/api/feeds");
      const data = await res.json();
      if (data.feeds) {
        setFeeds(data.feeds);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const activeFeed = feeds.find((f) => f.id === activeFeedId) || null;

  const handleSelectFeed = (id: number) => {
    setActiveFeedId(id);
    setActiveGroupType(null);
    setShowCreator(false);
  };

  const handleSelectGroup = (type: FeedType) => {
    setActiveGroupType(type);
    setActiveFeedId(null);
    setShowCreator(false);
  };

  const handleNewFeed = () => {
    setShowCreator(true);
    setActiveFeedId(null);
    setActiveGroupType(null);
  };

  const handleFeedSaved = () => {
    fetchFeeds();
    setShowCreator(false);
  };

  const handleFeedDeleted = () => {
    setActiveFeedId(null);
    setShowCreator(true);
    setActiveGroupType(null);
    fetchFeeds();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1">
          <img src="/logo-compact.svg" alt="" className="w-7 h-7" />
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="text-slate-800 dark:text-slate-200">Feed</span>
            <span className="text-cyan-600 dark:text-cyan-400">board</span>
            <span className="ml-1 text-xs font-bold bg-cyan-600 text-white px-1.5 py-0.5 rounded align-middle">
              PRO
            </span>
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          feeds={feeds}
          activeFeedId={activeFeedId}
          activeGroupType={activeGroupType}
          onSelectFeed={handleSelectFeed}
          onSelectGroup={handleSelectGroup}
          onNewFeed={handleNewFeed}
        />

        {/* Main area */}
        {showCreator ? (
          <FeedCreator onFeedSaved={handleFeedSaved} />
        ) : activeGroupType ? (
          <GroupOverview type={activeGroupType} />
        ) : activeFeed ? (
          <FeedDetail
            feed={activeFeed}
            onDelete={handleFeedDeleted}
            onUpdate={fetchFeeds}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
            Select a feed or create a new one
          </div>
        )}
      </div>
    </div>
  );
}
