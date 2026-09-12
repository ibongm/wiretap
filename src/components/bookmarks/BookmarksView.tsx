import React, { useEffect, useState } from 'react';
import { BookmarkedArticle } from '@/types/wiretap';
import { getAllOfflineBookmarks, removeOfflineBookmark, syncCloudBookmarks } from '@/services/offlineStorage';
import { useAuth } from '@/context/AuthContext';
import {
  BookmarkCheck,
  Trash2,
  ExternalLink,
  Clock,
  BookOpen,
  Search,
  WifiOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BookmarksViewProps {
  onOpenArticle: (article: BookmarkedArticle) => void;
  onBookmarkChanged?: () => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ onOpenArticle, onBookmarkChanged }) => {
  const { userProfile } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    setLoading(true);
    if (userProfile?.uid && !userProfile.isAnonymous) {
      const data = await syncCloudBookmarks(userProfile.uid);
      setBookmarks(data);
    } else {
      const data = await getAllOfflineBookmarks();
      setBookmarks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBookmarks();
  }, [userProfile?.uid]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeOfflineBookmark(id, userProfile?.uid);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    if (onBookmarkChanged) onBookmarkChanged();
  };

  const filtered = bookmarks.filter((b) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    return (
      b.title.toLowerCase().includes(query) ||
      b.sourceTitle.toLowerCase().includes(query) ||
      b.snippet.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Offline Reading Vault</h1>
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <WifiOff className="w-3 h-3" />
              <span>Available Offline</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {bookmarks.length} {bookmarks.length === 1 ? 'article' : 'articles'} cached locally in IndexedDB
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved articles..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Accessing IndexedDB storage...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="w-12 h-12 text-slate-700 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No saved articles yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">b</kbd> while browsing any article or click the bookmark icon to save it for offline distraction-free reading.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((article) => (
            <div
              key={article.id}
              onClick={() => onOpenArticle(article)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-indigo-400 truncate max-w-[180px]">
                    {article.sourceTitle}
                  </span>
                  <span className="flex items-center text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {article.readingTimeMinutes} min read
                  </span>
                </div>

                <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2 leading-snug">
                  {article.title}
                </h2>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {article.snippet}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                <span>Saved {formatDistanceToNow(new Date(article.savedAt), { addSuffix: true })}</span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDelete(article.id, e)}
                    title="Delete from offline storage"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open original website"
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
