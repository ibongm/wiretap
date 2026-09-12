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
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { NormalizedArticle, BookmarkedArticle, ExtractedArticleData } from '@/types/wiretap';
import {
  saveOfflineBookmark,
  removeOfflineBookmark,
  isArticleBookmarked
} from '@/services/offlineStorage';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { format } from 'date-fns';

interface ReaderDrawerProps {
  article: NormalizedArticle | BookmarkedArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkChanged?: () => void;
  onArticleRead?: (articleId: string) => void;
  initialFontFamily?: 'sans' | 'serif';
  initialFontSize?: number;
  onUpdateTypography?: (font: 'sans' | 'serif', size: number) => void;
}

export const ReaderDrawer: React.FC<ReaderDrawerProps> = ({
  article,
  isOpen,
  onClose,
  onBookmarkChanged,
  onArticleRead,
  initialFontFamily = 'serif',
  initialFontSize = 18,
  onUpdateTypography
}) => {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'oled' || theme === 'slate';

  const [extracted, setExtracted] = useState<ExtractedArticleData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>(initialFontFamily);
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Sync typography with parent preferences when initial props change
  useEffect(() => {
    if (initialFontFamily) setFontFamily(initialFontFamily);
  }, [initialFontFamily]);

  useEffect(() => {
    if (initialFontSize) setFontSize(initialFontSize);
  }, [initialFontSize]);

  // Lock background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (article && onArticleRead) {
        onArticleRead(article.id);
      }
    } else {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
    return () => {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, article?.id]);

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

    // If article already has rich contentHtml from RSS feed, use it
    if ('contentHtml' in article && article.contentHtml) {
      setExtracted({
        title: article.title,
        author: article.author || null,
        content: article.contentHtml,
        leadImageUrl: article.thumbnail || null,
        publishedAt: article.pubDate,
        readingTimeMinutes: Math.max(
          1,
          Math.ceil(article.contentHtml.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length / 200)
        ),
        sourceTitle: article.sourceTitle,
        url: article.link
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

  // Clean up speech synthesis when drawer closes or unmounts
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [isOpen, article]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
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

  const handleFontFamilyChange = (font: 'sans' | 'serif') => {
    setFontFamily(font);
    if (onUpdateTypography) onUpdateTypography(font, fontSize);
  };

  const handleFontSizeChange = (delta: number) => {
    const nextSize = Math.min(26, Math.max(14, fontSize + delta));
    setFontSize(nextSize);
    if (onUpdateTypography) onUpdateTypography(fontFamily, nextSize);
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const parser = new DOMParser();
      const doc = parser.parseFromString(displayContent || article?.snippet || '', 'text/html');
      const text = `${article?.title || ''}. ${doc.body.textContent || ''}`.trim();
      if (!text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
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
      thumbnail: 'thumbnail' in article ? article.thumbnail : ((article as BookmarkedArticle).leadImageUrl || undefined),
      contentHtml: extracted?.content || ('contentHtml' in article ? article.contentHtml : undefined)
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

  const handleShare = async () => {
    if (!article) return;
    const url = 'link' in article ? article.link : (article as BookmarkedArticle).originalUrl;
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

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
            {/* Audio Speech Narration */}
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                onClick={toggleSpeech}
                title={isSpeaking ? 'Stop narration' : 'Listen to article'}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking ? 'bg-indigo-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Font switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
              <button
                onClick={() => handleFontFamilyChange('sans')}
                className={`px-2 py-1 text-xs font-sans rounded-md transition-colors ${
                  fontFamily === 'sans' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => handleFontFamilyChange('serif')}
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
                onClick={() => handleFontSizeChange(-1)}
                title="Decrease font size"
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-300 px-1 font-mono">{fontSize}</span>
              <button
                onClick={() => handleFontSizeChange(1)}
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
              title="Share article or copy link"
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
              className={`prose ${
                isDark ? 'prose-invert prose-p:text-slate-200' : 'prose-stone prose-p:text-stone-800'
              } max-w-none transition-all ${
                fontFamily === 'serif' ? 'font-serif' : 'font-sans'
              } prose-p:leading-relaxed prose-headings:text-inherit prose-a:text-indigo-500 prose-img:rounded-xl prose-img:border prose-img:border-slate-800`}
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
