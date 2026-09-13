import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Loader2,
  Globe,
  Youtube,
  Tag,
  Compass,
  Link2,
  ExternalLink,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ApiDiscoverCandidate } from '@/types/wiretap';
import { CATALOG_CATEGORIES, CatalogFeed, POPULAR_FEEDS } from '@/data/popularFeeds';
import { searchCatalog, isUrlLike } from '@/utils/sourceSearch';

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  existingTags: string[];
  subscribedFeedUrls?: string[];
  initialSearchQuery?: string;
  onAddFeed: (feedData: {
    title: string;
    feedUrl: string;
    siteUrl: string;
    category: string;
    tags: string[];
    faviconUrl: string;
  }) => Promise<any>;
}

export const AddFeedModal: React.FC<AddFeedModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingTags,
  subscribedFeedUrls = [],
  initialSearchQuery = '',
  onAddFeed
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('All');
  const [addingFeedUrl, setAddingFeedUrl] = useState<string | null>(null);
  const [justSubscribedUrls, setJustSubscribedUrls] = useState<Set<string>>(new Set());

  // Custom / Manual Feed state
  const [inputUrl, setInputUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [candidates, setCandidates] = useState<ApiDiscoverCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ApiDiscoverCandidate | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'General');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial query if passed
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setActiveTab('search');
    }
  }, [initialSearchQuery]);

  // Set of all subscribed feed URLs (from props + newly added in this session)
  const allSubscribedUrls = useMemo(() => {
    const set = new Set(subscribedFeedUrls);
    justSubscribedUrls.forEach((url) => set.add(url));
    return set;
  }, [subscribedFeedUrls, justSubscribedUrls]);

  // Filtered catalog results
  const catalogResults = useMemo(() => {
    return searchCatalog(searchQuery, selectedCatalogCategory);
  }, [searchQuery, selectedCatalogCategory]);

  if (!isOpen) return null;

  // Handle one-click subscribe from the catalog
  const handleQuickSubscribe = async (feed: CatalogFeed) => {
    setAddingFeedUrl(feed.feedUrl);
    setError(null);

    try {
      await onAddFeed({
        title: feed.title,
        feedUrl: feed.feedUrl,
        siteUrl: feed.siteUrl,
        category: feed.category,
        tags: feed.tags,
        faviconUrl: feed.faviconUrl
      });
      setJustSubscribedUrls((prev) => new Set(prev).add(feed.feedUrl));
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe to feed.');
    } finally {
      setAddingFeedUrl(null);
    }
  };

  // Handle URL discovery in Custom Tab or Live Discovery
  const handleDiscover = async (urlToDiscover?: string) => {
    const target = (urlToDiscover || inputUrl).trim();
    if (!target) return;

    setDiscovering(true);
    setError(null);
    setCandidates([]);
    setSelectedCandidate(null);

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });
      const data = await res.json();
      if (!data.ok || !data.feeds || data.feeds.length === 0) {
        throw new Error(data.error || 'No RSS or Atom feeds could be discovered at this URL.');
      }
      setCandidates(data.feeds);
      setSelectedCandidate(data.feeds[0]);
      setCustomTitle(data.feeds[0].title || '');
      setActiveTab('custom');
    } catch (err: any) {
      setError(err.message || 'Failed to discover feed');
    } finally {
      setDiscovering(false);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleCustomSubmit = async () => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    setError(null);

    const finalCategory = isCreatingCategory && newCategoryInput.trim()
      ? newCategoryInput.trim()
      : selectedCategory;

    try {
      await onAddFeed({
        title: customTitle.trim() || selectedCandidate.title,
        feedUrl: selectedCandidate.url,
        siteUrl: selectedCandidate.siteUrl || inputUrl,
        category: finalCategory,
        tags,
        faviconUrl: selectedCandidate.faviconUrl || ''
      });
      setJustSubscribedUrls((prev) => new Set(prev).add(selectedCandidate.url));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save feed subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSearchInputUrl = isUrlLike(searchQuery);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800/80 bg-slate-900/90 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Explore & Add Sources</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Search verified publishers, topics, or paste any website/RSS link
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Directory ({POPULAR_FEEDS.length}+)</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Custom URL / Channel</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= TAB 1: SEARCH & DIRECTORY ================= */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-6 space-y-4">
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                placeholder="Search publications or topics (e.g. Reuters, TechCrunch, MMA, F1, AI)..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* URL Detection Banner */}
            {isSearchInputUrl && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-300 animate-in fade-in">
                <div className="flex items-center space-x-2 min-w-0">
                  <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">Looks like a custom website or feed link!</span>
                </div>
                <button
                  onClick={() => {
                    setInputUrl(searchQuery);
                    handleDiscover(searchQuery);
                  }}
                  disabled={discovering}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shrink-0 flex items-center space-x-1 transition-colors"
                >
                  {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Discover Feed</span>}
                </button>
              </div>
            )}

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
              {CATALOG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCatalogCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCatalogCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              {catalogResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
                  <h4 className="text-sm font-semibold text-slate-300">No sources found in catalog</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                    Try another keyword, or enter a direct website link to auto-discover its feed.
                  </p>
                  <button
                    onClick={() => {
                      setInputUrl(searchQuery);
                      setActiveTab('custom');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-400 rounded-xl text-xs font-semibold flex items-center space-x-2"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Try URL Discovery for "{searchQuery}"</span>
                  </button>
                </div>
              ) : (
                catalogResults.map((feed) => {
                  const isSubscribed = allSubscribedUrls.has(feed.feedUrl);
                  const isAdding = addingFeedUrl === feed.feedUrl;

                  return (
                    <div
                      key={feed.id}
                      className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700/80 flex items-center justify-between gap-3 transition-all group"
                    >
                      {/* Left: Favicon & Info */}
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center p-2 shrink-0 shadow-sm">
                          <img
                            src={feed.faviconUrl}
                            alt=""
                            className="w-6 h-6 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                              {feed.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                              {feed.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {feed.description}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-500 font-mono">
                            <span>{feed.siteUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Subscribe Action */}
                      <div className="shrink-0">
                        {isSubscribed ? (
                          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center space-x-1.5 select-none shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Subscribed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuickSubscribe(feed)}
                            disabled={isAdding}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {isAdding ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>Subscribe</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: CUSTOM URL / CHANNEL ================= */}
        {activeTab === 'custom' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Enter URL, Subreddit, or YouTube Channel
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDiscover();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com/feed, youtube.com/@veritasium, r/science"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={discovering || !inputUrl.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-semibold flex items-center space-x-2 transition-colors shrink-0 shadow-md"
                >
                  {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Discover</span>}
                </button>
              </form>
            </div>

            {/* Discovered Candidates List */}
            {candidates.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Discovered Feed ({candidates.length} found)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {candidates.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedCandidate(c);
                        setCustomTitle(c.title);
                      }}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        selectedCandidate?.url === c.url
                          ? 'bg-indigo-950/60 border-indigo-500 text-white'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                        {c.url.includes('youtube.com') ? (
                          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{c.title || 'Untitled Feed'}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{c.url}</p>
                        </div>
                      </div>
                      {selectedCandidate?.url === c.url && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </div>
                  ))}
                </div>

                {/* Title override */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Feed Display Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(false)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(true)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-indigo-400 font-medium flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tag assignment */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="e.g. ai, investigative, hardware"
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300"
                    >
                      Add
                    </button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-indigo-950/40"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Subscribe & Save Feed</span>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
