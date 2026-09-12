import React, { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { SubscribedFeed, NormalizedArticle, UserPreferences } from '@/types/wiretap';
import { formatDistanceToNow } from 'date-fns';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { isArticleBookmarked, saveOfflineBookmark, removeOfflineBookmark } from '@/services/offlineStorage';
import { useAuth } from '@/context/AuthContext';
import { getSmartTagsForArticle } from '@/utils/smartTags';

interface FirehoseProps {
  feeds: SubscribedFeed[];
  preferences: UserPreferences;
  selectedCategory: string | null;
  selectedTag: string | null;
  selectedFeedId?: string | null;
  searchQuery: string;
  selectedIndex: number;
  onSelectArticle: (index: number) => void;
  onOpenArticle: (article: NormalizedArticle) => void;
  onBookmarkChanged?: () => void;
  onSelectFeed?: (feedId: string | null) => void;
  onSelectTag?: (tag: string | null) => void;
}

const ITEMS_PER_PAGE = 25;

export const Firehose: React.FC<FirehoseProps> = ({
  feeds,
  preferences,
  selectedCategory,
  selectedTag,
  selectedFeedId,
  searchQuery,
  selectedIndex,
  onSelectArticle,
  onOpenArticle,
  onBookmarkChanged,
  onSelectFeed,
  onSelectTag
}) => {
  const { userProfile } = useAuth();
  const [displayCount, setDisplayCount] = useState<number>(ITEMS_PER_PAGE);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Filter feeds based on active Source, Category, or Feed-level Tag
  const activeFeeds = useMemo(() => {
    return feeds.filter((f) => {
      if (selectedFeedId && f.id !== selectedFeedId) {
        return false;
      }
      if (selectedCategory && f.category?.trim().toLowerCase() !== selectedCategory.trim().toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [feeds, selectedFeedId, selectedCategory]);

  // Fetch feeds in parallel using TanStack Query
  const queryResults = useQueries({
    queries: activeFeeds.map((feed) => ({
      queryKey: ['feed', feed.feedUrl],
      queryFn: async () => {
        const res = await fetch(`/api/feed?url=${encodeURIComponent(feed.feedUrl)}`);
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || 'Failed to load feed');
        }
        return {
          feedId: feed.id,
          sourceTitle: feed.title,
          faviconUrl: feed.faviconUrl,
          items: (data.feed?.items || []).map((item: any) => ({
            ...item,
            feedId: feed.id,
            sourceTitle: feed.title,
            faviconUrl: item.faviconUrl || feed.faviconUrl
          }))
        };
      },
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
      refetchInterval: 1000 * 60 * 10 // 10 minutes background refresh
    }))
  });

  const isLoading = queryResults.some((q) => q.isLoading && !q.data);
  const isFetchingAny = queryResults.some((q) => q.isFetching);

  // Merge, deduplicate, filter, and sort articles
  const processedArticles = useMemo(() => {
    const rawList: NormalizedArticle[] = [];
    const seenLinks = new Set<string>();

    // 1. Merge all items and assign smart topic tags
    for (const res of queryResults) {
      if (res.data?.items) {
        for (const item of res.data.items) {
          const key = item.link || item.id;
          if (!seenLinks.has(key)) {
            seenLinks.add(key);
            const smartTags = getSmartTagsForArticle(item.title, item.snippet);
            rawList.push({
              ...item,
              smartTags
            });
          }
        }
      }
    }

    // 2. Filter by selectedTag (matching smart topic tags or feed-level tags)
    let filtered = rawList;
    if (selectedTag) {
      const targetTag = selectedTag.toLowerCase();
      filtered = filtered.filter((item) => {
        if (item.smartTags?.some((t) => t.toLowerCase() === targetTag)) {
          return true;
        }
        const parentFeed = feeds.find((f) => f.id === item.feedId);
        if (parentFeed?.tags?.some((t) => t.toLowerCase() === targetTag)) {
          return true;
        }
        return false;
      });
    }

    // 3. Apply Bullshit Filter (Muted Keywords Regex)
    const mutedPatterns = (preferences.mutedKeywords || [])
      .map((kw) => kw.trim())
      .filter(Boolean)
      .map((kw) => new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i'));

    filtered = filtered.filter((item) => {
      if (mutedPatterns.length === 0) return true;
      const targetText = `${item.title} ${item.snippet}`;
      return !mutedPatterns.some((pattern) => pattern.test(targetText));
    });

    // 4. Apply Real-Time Search Query (Regex or Substring)
    if (searchQuery.trim()) {
      try {
        const searchRegex = new RegExp(searchQuery.trim(), 'i');
        filtered = filtered.filter(
          (item) => searchRegex.test(item.title) || searchRegex.test(item.snippet) || searchRegex.test(item.sourceTitle)
        );
      } catch {
        const lower = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(lower) ||
            item.snippet.toLowerCase().includes(lower) ||
            item.sourceTitle.toLowerCase().includes(lower)
        );
      }
    }

    // 4. Sort Mode
    const sortMode = preferences.activeSort || 'newest';
    if (sortMode === 'newest') {
      filtered.sort((a, b) => b.pubDate - a.pubDate);
    } else if (sortMode === 'oldest') {
      filtered.sort((a, b) => a.pubDate - b.pubDate);
    } else if (sortMode === 'source') {
      filtered.sort((a, b) => {
        const sourceDiff = a.sourceTitle.localeCompare(b.sourceTitle);
        if (sourceDiff !== 0) return sourceDiff;
        return b.pubDate - a.pubDate;
      });
    }

    return filtered;
  }, [queryResults, preferences.mutedKeywords, preferences.activeSort, searchQuery, selectedTag, feeds]);

  // Initial check of bookmarks for visible articles
  React.useEffect(() => {
    let isMounted = true;
    const checkBookmarks = async () => {
      const ids = new Set<string>();
      for (const item of processedArticles.slice(0, displayCount)) {
        if (await isArticleBookmarked(item.id)) {
          ids.add(item.id);
        }
      }
      if (isMounted) setBookmarkedIds(ids);
    };
    checkBookmarks();
    return () => {
      isMounted = false;
    };
  }, [processedArticles, displayCount]);

  const toggleBookmark = async (article: NormalizedArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    const isBookmarked = bookmarkedIds.has(article.id);
    if (isBookmarked) {
      await removeOfflineBookmark(article.id, userProfile?.uid);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(article.id);
        return next;
      });
    } else {
      await saveOfflineBookmark(article, '', null, 2, userProfile?.uid);
      setBookmarkedIds((prev) => new Set(prev).add(article.id));
    }
    if (onBookmarkChanged) onBookmarkChanged();
  };

  const density = preferences.density || 'cards';
  const cutoffTimestamp = selectedCategory ? (preferences.readCutoffs || {})[selectedCategory] || 0 : 0;
  const visibleArticles = processedArticles.slice(0, displayCount);

  if (activeFeeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-300">No feeds in this view</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select another category or tag, or click "Add Feed" to subscribe to new sources.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-400">Aggregating fresh firehose intelligence...</p>
        <p className="text-xs text-slate-600 mt-1">Parallel fetching {activeFeeds.length} feeds</p>
      </div>
    );
  }

  if (processedArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Sparkles className="w-12 h-12 text-indigo-400/40 mb-3" />
        <h3 className="text-lg font-semibold text-slate-300">No articles match your criteria</h3>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          {preferences.mutedKeywords?.length
            ? 'Some articles may have been filtered out by your Bullshit Filter keyword mute list.'
            : 'Try refining your search query or refreshing your feed list.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Background Fetch Indicator */}
      {isFetchingAny && (
        <div className="flex items-center justify-end space-x-2 text-xs text-indigo-400 mb-4 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Refreshing feed telemetry...</span>
        </div>
      )}

      {/* 1. CARDS MODE */}
      {density === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleArticles.map((article, idx) => {
            const isSelected = selectedIndex === idx;
            const isRead = cutoffTimestamp > 0 && article.pubDate <= cutoffTimestamp;
            const isBookmarked = bookmarkedIds.has(article.id);

            return (
              <article
                key={article.id}
                onClick={() => {
                  onSelectArticle(idx);
                  onOpenArticle(article);
                }}
                className={`group relative flex flex-col rounded-2xl bg-slate-900 border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/40'
                    : 'border-slate-800 hover:border-slate-700 hover:shadow-md'
                } ${isRead ? 'opacity-65' : 'opacity-100'}`}
              >
                {/* Hero Thumbnail or Publisher Favicon Header */}
                {article.thumbnail ? (
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  </div>
                ) : (
                  <div className="h-28 w-full bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between px-6">
                    {article.faviconUrl ? (
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center p-2.5 shadow-md">
                        <img
                          src={article.faviconUrl}
                          alt=""
                          className="w-7 h-7 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 font-bold text-sm shadow">
                        {article.sourceTitle.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {article.smartTags && article.smartTags.length > 0 && (
                      <span
                        onClick={(e) => {
                          if (onSelectTag) {
                            e.stopPropagation();
                            onSelectTag(article.smartTags![0]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm ${
                          onSelectTag ? 'hover:bg-indigo-500/30 cursor-pointer transition-colors' : ''
                        }`}
                        title={onSelectTag ? `Filter by #${article.smartTags[0]}` : undefined}
                      >
                        #{article.smartTags[0]}
                      </span>
                    )}
                  </div>
                )}

                {/* Card Content */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    {/* Source, Tag & Date Pill */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 gap-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {article.thumbnail && article.faviconUrl && (
                          <img
                            src={article.faviconUrl}
                            alt=""
                            className="w-3.5 h-3.5 rounded shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span
                          onClick={(e) => {
                            if (article.feedId && onSelectFeed) {
                              e.stopPropagation();
                              onSelectFeed(article.feedId);
                            }
                          }}
                          className={`font-semibold text-indigo-400 truncate max-w-[140px] ${
                            article.feedId && onSelectFeed ? 'hover:underline hover:text-indigo-300 cursor-pointer' : ''
                          }`}
                          title={article.feedId && onSelectFeed ? `Filter by ${article.sourceTitle}` : undefined}
                        >
                          {article.sourceTitle}
                        </span>
                        {article.thumbnail && article.smartTags && article.smartTags.length > 0 && (
                          <span
                            onClick={(e) => {
                              if (onSelectTag) {
                                e.stopPropagation();
                                onSelectTag(article.smartTags![0]);
                              }
                            }}
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shrink-0 ${
                              onSelectTag ? 'hover:bg-indigo-500/30 cursor-pointer transition-colors' : ''
                            }`}
                            title={onSelectTag ? `Filter by #${article.smartTags[0]}` : undefined}
                          >
                            #{article.smartTags[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] flex items-center text-slate-500 whitespace-nowrap shrink-0">
                        <Clock className="w-3 h-3 mr-1 shrink-0" />
                        {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug mb-2">
                      {article.title}
                    </h2>

                    {/* Snippet */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {article.snippet}
                    </p>
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-500 truncate max-w-[140px]">
                      {article.author ? `By ${article.author}` : ''}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => toggleBookmark(article, e)}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark for offline'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open external source"
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 2. COMPACT SCAN MODE */}
      {density === 'compact' && (
        <div className="divide-y divide-slate-800/80 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {visibleArticles.map((article, idx) => {
            const isSelected = selectedIndex === idx;
            const isRead = cutoffTimestamp > 0 && article.pubDate <= cutoffTimestamp;
            const isBookmarked = bookmarkedIds.has(article.id);

            return (
              <div
                key={article.id}
                onClick={() => {
                  onSelectArticle(idx);
                  onOpenArticle(article);
                }}
                className={`group flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                    : 'hover:bg-slate-800/50'
                } ${isRead ? 'opacity-60' : 'opacity-100'}`}
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1 mr-4">
                  {/* Small 48x48 thumbnail or Publisher Favicon Fallback */}
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt=""
                      loading="lazy"
                      className="w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : article.faviconUrl ? (
                    <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shrink-0 p-2.5 shadow-sm">
                      <img
                        src={article.faviconUrl}
                        alt=""
                        className="w-6 h-6 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xs">
                      {article.sourceTitle.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mb-0.5">
                      <span
                        onClick={(e) => {
                          if (article.feedId && onSelectFeed) {
                            e.stopPropagation();
                            onSelectFeed(article.feedId);
                          }
                        }}
                        className={`font-semibold text-indigo-400 truncate max-w-[140px] ${
                          article.feedId && onSelectFeed ? 'hover:underline hover:text-indigo-300 cursor-pointer' : ''
                        }`}
                        title={article.feedId && onSelectFeed ? `Filter by ${article.sourceTitle}` : undefined}
                      >
                        {article.sourceTitle}
                      </span>
                      {article.smartTags && article.smartTags.length > 0 && (
                        <button
                          onClick={(e) => {
                            if (onSelectTag) {
                              e.stopPropagation();
                              onSelectTag(article.smartTags![0]);
                            }
                          }}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 ${
                            onSelectTag ? 'hover:bg-indigo-500/30 cursor-pointer transition-colors' : ''
                          }`}
                          title={onSelectTag ? `Filter by #${article.smartTags[0]}` : undefined}
                        >
                          #{article.smartTags[0]}
                        </button>
                      )}
                      <span>•</span>
                      <span className="text-[11px] text-slate-500">
                        {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {article.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => toggleBookmark(article, e)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isBookmarked
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-500 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. MINIMALIST HEADLINES MODE */}
      {density === 'minimal' && (
        <div className="divide-y divide-slate-800/80 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {visibleArticles.map((article, idx) => {
            const isSelected = selectedIndex === idx;
            const isRead = cutoffTimestamp > 0 && article.pubDate <= cutoffTimestamp;
            const isBookmarked = bookmarkedIds.has(article.id);

            return (
              <div
                key={article.id}
                onClick={() => {
                  onSelectArticle(idx);
                  onOpenArticle(article);
                }}
                className={`group flex items-baseline justify-between py-2.5 px-4 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/50 border-l-4 border-indigo-500'
                    : 'hover:bg-slate-800/40'
                } ${isRead ? 'opacity-55' : 'opacity-100'}`}
              >
                <div className="flex items-baseline space-x-3 min-w-0 flex-1 mr-4">
                  <span
                    onClick={(e) => {
                      if (article.feedId && onSelectFeed) {
                        e.stopPropagation();
                        onSelectFeed(article.feedId);
                      }
                    }}
                    className={`text-[11px] font-mono font-medium text-indigo-400/90 shrink-0 w-28 truncate ${
                      article.feedId && onSelectFeed ? 'hover:underline hover:text-indigo-300 cursor-pointer' : ''
                    }`}
                    title={article.feedId && onSelectFeed ? `Filter by ${article.sourceTitle}` : undefined}
                  >
                    {article.sourceTitle}
                  </span>
                  <h4 className="text-sm text-slate-200 group-hover:text-white font-medium truncate">
                    {article.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-xs">
                  <span className="text-[11px] text-slate-500">
                    {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(article, e)}
                    className={`p-1 rounded transition-colors ${
                      isBookmarked ? 'text-amber-400' : 'text-slate-600 hover:text-white'
                    }`}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll / Load More Trigger */}
      {processedArticles.length > displayCount && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors shadow-sm"
          >
            <span>Load more dispatches ({processedArticles.length - displayCount} remaining)</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
