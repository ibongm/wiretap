import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useUserFeeds } from '@/hooks/useUserFeeds';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Shell } from '@/components/layout/Shell';
import { Firehose } from '@/components/feed/Firehose';
import { BookmarksView } from '@/components/bookmarks/BookmarksView';
import { ReaderDrawer } from '@/components/reader/ReaderDrawer';
import { AddFeedModal } from '@/components/feed/AddFeedModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { NormalizedArticle, BookmarkedArticle } from '@/types/wiretap';
import { saveOfflineBookmark, removeOfflineBookmark, isArticleBookmarked } from '@/services/offlineStorage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function WiretapApp() {
  const {
    feeds,
    preferences,
    loading: feedsLoading,
    addFeed,
    removeFeed,
    batchAddFeeds,
    updatePreferences,
    markCategoryAsRead
  } = useUserFeeds();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'firehose' | 'bookmarks'>('firehose');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Modals & Drawers
  const [readerArticle, setReaderArticle] = useState<NormalizedArticle | BookmarkedArticle | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState<boolean>(false);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Categories & Tags list for AddFeedModal
  const categories = useMemo(() => {
    return Array.from(new Set(feeds.map((f) => f.category || 'General'))).sort();
  }, [feeds]);

  const existingTags = useMemo(() => {
    return Array.from(new Set(feeds.flatMap((f) => f.tags || []))).sort();
  }, [feeds]);

  // Open article in Reader Drawer
  const handleOpenArticle = (article: NormalizedArticle | BookmarkedArticle) => {
    setReaderArticle(article);
    setIsReaderOpen(true);
  };

  // Keyboard shortcut actions
  const isAnyModalOpen = isAddFeedOpen || isSettingsOpen || isAuthOpen || isReaderOpen;

  useKeyboardShortcuts({
    articles: [], // Will be handled inside firehose or general navigation
    selectedIndex,
    setSelectedIndex,
    onOpenArticle: (art) => handleOpenArticle(art),
    onToggleBookmark: async (art) => {
      const exists = await isArticleBookmarked(art.id);
      if (exists) {
        await removeOfflineBookmark(art.id);
      } else {
        await saveOfflineBookmark(art);
      }
    },
    isModalOpen: isAnyModalOpen
  });

  return (
    <ThemeProvider
      initialTheme={preferences.theme}
      onThemeChange={(theme) => updatePreferences({ theme })}
    >
      <Shell
        feeds={feeds}
        preferences={preferences}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        activeView={activeView}
        searchQuery={searchQuery}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedIndex(0);
        }}
        onSelectTag={(tag) => {
          setSelectedTag(tag);
          setSelectedIndex(0);
        }}
        onSelectView={(v) => {
          setActiveView(v);
          setSelectedIndex(0);
        }}
        onSearchChange={setSearchQuery}
        onDensityChange={(density) => updatePreferences({ density })}
        onSortChange={(activeSort) => updatePreferences({ activeSort })}
        onMarkCategoryRead={(cat) => markCategoryAsRead(cat)}
        onDeleteFeed={removeFeed}
        onOpenAddFeed={() => setIsAddFeedOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      >
        {activeView === 'firehose' ? (
          <Firehose
            feeds={feeds}
            preferences={preferences}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            selectedIndex={selectedIndex}
            onSelectArticle={setSelectedIndex}
            onOpenArticle={handleOpenArticle}
          />
        ) : (
          <BookmarksView onOpenArticle={handleOpenArticle} />
        )}

        {/* Reader Drawer */}
        <ReaderDrawer
          article={readerArticle}
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
        />

        {/* Add Feed Modal */}
        <AddFeedModal
          isOpen={isAddFeedOpen}
          onClose={() => setIsAddFeedOpen(false)}
          categories={categories}
          existingTags={existingTags}
          onAddFeed={addFeed}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
          feeds={feeds}
          onBatchAddFeeds={batchAddFeeds}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </Shell>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WiretapApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
