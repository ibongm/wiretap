import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  Clock,
  User,
  Calendar,
  Type,
  Minus,
  Plus,
  Loader2,
  Check
} from 'lucide-react';
import { NormalizedArticle, BookmarkedArticle, ExtractedArticleData } from '@/types/wiretap';
import {
  saveOfflineBookmark,
  removeOfflineBookmark,
  isArticleBookmarked
} from '@/services/offlineStorage';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface ReaderDrawerProps {
  article: NormalizedArticle | BookmarkedArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkChanged?: () => void;
}

export const ReaderDrawer: React.FC<ReaderDrawerProps> = ({
  article,
  isOpen,
  onClose,
  onBookmarkChanged
}) => {
  const { userProfile } = useAuth();
  const [extracted, setExtracted] = useState<ExtractedArticleData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('serif');
  const [fontSize, setFontSize] = useState<number>(18);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Derive active hero lead image URL
  const heroImageUrl =
    extracted?.leadImageUrl ||
    (article && 'thumbnail' in article ? (article as any).thumbnail : null) ||
    null;

  // Deduplicate lead image from article content if already displayed in hero container
  const displayContent = useMemo(() => {
    if (!extracted?.content) return '';
    if (!heroImageUrl) return extracted.content;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(extracted.content, 'text/html');
      const firstImg = doc.querySelector('img');
      if (firstImg) {
        const src = firstImg.getAttribute('src') || '';
        const cleanSrc = src.split('?')[0].replace(/^https?:/, '');
        const cleanHero = heroImageUrl.split('?')[0].replace(/^https?:/, '');

        const isExactOrParamMatch =
          src === heroImageUrl ||
          cleanSrc === cleanHero ||
          (cleanSrc.length > 15 && cleanHero.includes(cleanSrc)) ||
          (cleanHero.length > 15 && cleanSrc.includes(cleanLeadText(cleanHero)));

        // Check if the image appears at the beginning of the article (before any substantive text)
        const textBeforeImg = doc.body.textContent?.slice(0, 80).trim() || '';
        const isLeadingImg =
          doc.body.firstElementChild === firstImg ||
          doc.body.firstElementChild?.querySelector('img') === firstImg ||
          doc.body.firstElementChild?.tagName.toLowerCase() === 'figure' ||
          textBeforeImg.length < 40;

        if (isExactOrParamMatch || isLeadingImg) {
          const parentFigure = firstImg.closest('figure');
          if (parentFigure) {
            parentFigure.remove();
          } else {
            firstImg.remove();
          }
          return doc.body.innerHTML;
        }
      }
    } catch (err) {
      console.error('Failed to deduplicate lead image in ReaderDrawer:', err);
    }
    return extracted.content;
  }, [extracted?.content, heroImageUrl]);

  function cleanLeadText(str: string) {
    return str.split('#')[0];
  }

  // Check bookmark state and fetch article content
  useEffect(() => {
    if (!isOpen || !article) {
      setExtracted(null);
      setError(null);
      setScrollProgress(0);
      return;
    }

    // Check if already in bookmarks
    isArticleBookmarked(article.id).then(setIsBookmarked);

    // If it's already a BookmarkedArticle with extractedHtml
    if ('extractedHtml' in article && article.extractedHtml) {
      setExtracted({
        title: article.title,
        author: article.author,
        content: article.extractedHtml,
        leadImageUrl: article.leadImageUrl,
        publishedAt: article.publishedAt,
        readingTimeMinutes: article.readingTimeMinutes,
        sourceTitle: article.sourceTitle,
        url: article.originalUrl
      });
      setLoading(false);
      return;
    }

    // Otherwise, fetch via /api/article
    const articleUrl = 'link' in article ? article.link : (article as BookmarkedArticle).originalUrl;
    if (!articleUrl) return;

    setLoading(true);
    setError(null);

    fetch(`/api/article?url=${encodeURIComponent(articleUrl)}`)
      .then(async (res) => {
        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = { ok: false, error: 'Full article text is protected or unavailable from publisher.' };
        }
        if (data.ok && data.article) {
          setExtracted(data.article);
        } else {
          setError(data.error || 'Full article text is protected or unavailable from publisher.');
        }
      })
      .catch(() => {
        setError('Full article text is protected or unavailable from publisher.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, article]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Track scroll percentage
  const handleScroll = () => {
    if (!contentContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentContainerRef.current;
    if (scrollHeight <= clientHeight) {
      setScrollProgress(100);
      return;
    }
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  const handleToggleBookmark = async () => {
    if (!article) return;
    const articleLink = 'link' in article ? article.link : (article as BookmarkedArticle).originalUrl;
    const normalized: NormalizedArticle = {
      id: article.id,
      title: article.title,
      link: articleLink,
      pubDate: 'pubDate' in article ? article.pubDate : article.publishedAt,
      sourceTitle: article.sourceTitle,
      snippet: article.snippet,
      author: article.author || undefined,
      thumbnail: 'thumbnail' in article ? article.thumbnail : ((article as BookmarkedArticle).leadImageUrl || undefined)
    };

    if (isBookmarked) {
      await removeOfflineBookmark(article.id, userProfile?.uid);
      setIsBookmarked(false);
    } else {
      await saveOfflineBookmark(
        normalized,
        extracted?.content || '',
        extracted?.leadImageUrl || normalized.thumbnail || null,
        extracted?.readingTimeMinutes || 2,
        userProfile?.uid
      );
      setIsBookmarked(true);
    }
    if (onBookmarkChanged) onBookmarkChanged();
  };

  const handleShare = () => {
    const url = article ? ('link' in article ? article.link : (article as BookmarkedArticle).originalUrl) : '';
    if (!url) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !article) return null;

  const articleUrl = 'link' in article ? article.link : (article as BookmarkedArticle).originalUrl;
  const pubDate = 'pubDate' in article ? article.pubDate : article.publishedAt;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="relative w-full lg:max-w-[720px] h-full bg-slate-900 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Scroll Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-30">
          <div
            className="h-full bg-indigo-500 transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Pinned Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={onClose}
              title="Close reader (Esc)"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
            <span className="text-xs font-medium text-slate-400 max-w-[140px] sm:max-w-[220px] truncate">
              {article.sourceTitle}
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Font switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
              <button
                onClick={() => setFontFamily('sans')}
                className={`px-2 py-1 text-xs font-sans rounded-md transition-colors ${
                  fontFamily === 'sans' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily('serif')}
                className={`px-2 py-1 text-xs font-serif rounded-md transition-colors ${
                  fontFamily === 'serif' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Serif
              </button>
            </div>

            {/* Font size steppers */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                title="Decrease font size"
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-300 px-1 font-mono">{fontSize}</span>
              <button
                onClick={() => setFontSize((s) => Math.min(26, s + 1))}
                title="Increase font size"
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={handleToggleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Save for offline reading'}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              title="Copy link to clipboard"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copied && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-emerald-400 text-[10px] px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>

            {/* Open Original */}
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open original website"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Article Scrollable Body */}
        <div
          ref={contentContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 custom-scrollbar"
        >
          {/* Header Metadata */}
          <div className="mb-8 border-b border-slate-800/80 pb-6">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
              <span>{article.sourceTitle}</span>
              {extracted?.readingTimeMinutes && (
                <>
                  <span>•</span>
                  <span className="flex items-center text-slate-400 lowercase font-normal">
                    <Clock className="w-3 h-3 mr-1" />
                    {extracted.readingTimeMinutes} min read
                  </span>
                </>
              )}
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4 leading-snug ${
                fontFamily === 'serif' ? 'font-serif' : 'font-sans'
              }`}
            >
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {(article.author || extracted?.author) && (
                <div className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{article.author || extracted?.author}</span>
                </div>
              )}
              {pubDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{format(new Date(pubDate), 'MMMM d, yyyy • h:mm a')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lead Image */}
          {heroImageUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={heroImageUrl}
                alt={article.title}
                className="w-full max-h-[420px] object-cover"
                loading="lazy"
                onError={(e) => {
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) parent.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Extraction Loader */}
          {loading && (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              <div className="h-24 bg-slate-800/40 rounded-xl mt-6"></div>
              <div className="flex items-center justify-center py-6 text-xs text-slate-500 space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Distilling clean editorial typography...</span>
              </div>
            </div>
          )}

          {/* Render Extracted Article Content */}
          {displayContent ? (
            <div
              className={`prose prose-invert max-w-none transition-all ${
                fontFamily === 'serif' ? 'font-serif' : 'font-sans'
              } prose-p:leading-relaxed prose-p:text-slate-200 prose-headings:text-white prose-a:text-indigo-400 prose-img:rounded-xl prose-img:border prose-img:border-slate-800`}
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : !loading && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold text-white">Syndicated Feed Summary</p>
                  <p className="text-slate-400 mt-0.5">
                    {error || "Full text is protected or requires browser viewing directly on publisher."}
                  </p>
                </div>
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shrink-0 shadow-sm"
                >
                  <span>Open Full Article</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Snippet / Description */}
              {article.snippet && (
                <div
                  className={`prose prose-invert max-w-none text-slate-200 leading-relaxed ${
                    fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                  }`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <p>{article.snippet}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
