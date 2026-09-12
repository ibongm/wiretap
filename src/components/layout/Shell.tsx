import React, { useState } from 'react';
import {
  Rss,
  Bookmark,
  Sliders,
  Plus,
  Search,
  CheckCheck,
  LayoutGrid,
  List,
  AlignLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Trash2,
  Tag,
  Folder,
  User,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { SubscribedFeed, UserPreferences } from '@/types/wiretap';
import { useAuth } from '@/context/AuthContext';

interface ShellProps {
  feeds: SubscribedFeed[];
  preferences: UserPreferences;
  selectedCategory: string | null;
  selectedTag: string | null;
  activeView: 'firehose' | 'bookmarks';
  searchQuery: string;
  onSelectCategory: (category: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  onSelectView: (view: 'firehose' | 'bookmarks') => void;
  onSearchChange: (query: string) => void;
  onDensityChange: (density: 'cards' | 'compact' | 'minimal') => void;
  onSortChange: (sort: 'newest' | 'oldest' | 'source') => void;
  onMarkCategoryRead: (category: string) => void;
  onDeleteFeed: (feedId: string) => void;
  onOpenAddFeed: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  feeds,
  preferences,
  selectedCategory,
  selectedTag,
  activeView,
  searchQuery,
  onSelectCategory,
  onSelectTag,
  onSelectView,
  onSearchChange,
  onDensityChange,
  onSortChange,
  onMarkCategoryRead,
  onDeleteFeed,
  onOpenAddFeed,
  onOpenSettings,
  onOpenAuth,
  children
}) => {
  const { userProfile, isAnonymous } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [editingFeeds, setEditingFeeds] = useState<boolean>(false);

  // Group feeds by category
  const categories = Array.from(new Set(feeds.map((f) => f.category || 'General'))).sort();

  // Extract all unique tags
  const allTags = Array.from(
    new Set(feeds.flatMap((f) => f.tags || []))
  ).sort();

  const handleCategoryClick = (cat: string | null) => {
    onSelectCategory(cat);
    onSelectTag(null);
    onSelectView('firehose');
    setMobileMenuOpen(false);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      onSelectTag(null);
    } else {
      onSelectTag(tag);
      onSelectCategory(null);
    }
    onSelectView('firehose');
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
          <div
            onClick={() => handleCategoryClick(null)}
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Rss className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-black tracking-tight text-base text-white">WIRETAP</span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
            )}
          </div>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close mobile menu */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {/* Quick Views */}
          <div className="space-y-1">
            {/* All Articles */}
            <button
              onClick={() => handleCategoryClick(null)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeView === 'firehose' && !selectedCategory && !selectedTag
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Full Firehose</span>}
            </button>

            {/* Offline Bookmarks */}
            <button
              onClick={() => {
                onSelectView('bookmarks');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeView === 'bookmarks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4 shrink-0 text-amber-400" />
              {!sidebarCollapsed && <span>Offline Bookmarks</span>}
            </button>
          </div>

          {/* Categories List */}
          {!sidebarCollapsed && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Categories
                </span>
              </div>
              <div className="space-y-0.5">
                {categories.map((cat) => {
                  const isSelected = activeView === 'firehose' && selectedCategory === cat;
                  const catFeedCount = feeds.filter((f) => f.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cat}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                        {catFeedCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags List */}
          {!sidebarCollapsed && allTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Topic Tags
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 px-2">
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feed Manager List */}
          {!sidebarCollapsed && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Subscribed ({feeds.length})
                </span>
                <button
                  onClick={() => setEditingFeeds(!editingFeeds)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {editingFeeds ? 'Done' : 'Manage'}
                </button>
              </div>

              <div className="space-y-1">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          feed.healthStatus === 'failing' ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        title={feed.healthStatus === 'failing' ? 'Feed error reported' : 'Feed healthy'}
                      />
                      <span className="truncate">{feed.title}</span>
                    </div>

                    {editingFeeds && (
                      <button
                        onClick={() => onDeleteFeed(feed.id)}
                        title="Unsubscribe feed"
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onOpenAddFeed}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            {!sidebarCollapsed && <span>Add Feed Source</span>}
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={onOpenSettings}
              title="Settings & Bullshit Filter"
              className="flex-1 flex items-center justify-center space-x-2 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              <Sliders className="w-4 h-4" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>

            <button
              onClick={onOpenAuth}
              title={isAnonymous ? 'Guest Mode (Click to Upgrade)' : 'Account'}
              className="flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-medium relative"
            >
              <User className="w-4 h-4" />
              {isAnonymous && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
          {/* Mobile hamburger */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <span>{selectedCategory || (selectedTag ? `#${selectedTag}` : 'Firehose')}</span>
                {selectedCategory && (
                  <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                    • {feeds.filter((f) => f.category === selectedCategory).length} feeds
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Instant headline filter (regex supported)..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Controls: Density Switcher, Sort & Mark as Read */}
          <div className="flex items-center space-x-2">
            {/* Mark Category As Read */}
            {selectedCategory && activeView === 'firehose' && (
              <button
                onClick={() => onMarkCategoryRead(selectedCategory)}
                title="Mark all articles in category as read"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark Read</span>
              </button>
            )}

            {/* Sort Mode Select */}
            <div className="relative hidden sm:flex items-center">
              <select
                value={preferences.activeSort || 'newest'}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="pl-2 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="source">Group by Source</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Density Switcher */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                onClick={() => onDensityChange('cards')}
                title="Magazine Cards Mode"
                className={`p-1.5 rounded-lg transition-colors ${
                  preferences.density === 'cards'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDensityChange('compact')}
                title="Compact Scan Mode"
                className={`p-1.5 rounded-lg transition-colors ${
                  preferences.density === 'compact'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDensityChange('minimal')}
                title="Minimalist Headlines Mode"
                className={`p-1.5 rounded-lg transition-colors ${
                  preferences.density === 'minimal'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        <div className="p-3 border-b border-slate-800/60 md:hidden bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter headlines..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Scrollable Feed / Bookmarks Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
