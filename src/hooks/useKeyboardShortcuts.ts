import { useEffect } from 'react';
import { NormalizedArticle } from '@/types/wiretap';

interface KeyboardShortcutsOptions {
  articles: NormalizedArticle[];
  selectedIndex: number;
  setSelectedIndex: (index: number | ((prev: number) => number)) => void;
  onOpenArticle: (article: NormalizedArticle) => void;
  onToggleBookmark: (article: NormalizedArticle) => void;
  onToggleRead?: (article: NormalizedArticle) => void;
  isModalOpen?: boolean;
}

export function useKeyboardShortcuts({
  articles,
  selectedIndex,
  setSelectedIndex,
  onOpenArticle,
  onToggleBookmark,
  onToggleRead,
  isModalOpen = false
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea or if modal is open
      const target = e.target as HTMLElement;
      if (
        isModalOpen ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (articles.length === 0) return;

      switch (e.key.toLowerCase()) {
        case 'j': {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(articles.length - 1, prev + 1));
          break;
        }
        case 'k': {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(0, prev - 1));
          break;
        }
        case 'enter':
        case ' ': {
          e.preventDefault();
          const currentArticle = articles[selectedIndex];
          if (currentArticle) {
            onOpenArticle(currentArticle);
          }
          break;
        }
        case 'b': {
          e.preventDefault();
          const currentArticle = articles[selectedIndex];
          if (currentArticle) {
            onToggleBookmark(currentArticle);
          }
          break;
        }
        case 'o': {
          e.preventDefault();
          const currentArticle = articles[selectedIndex];
          if (currentArticle?.link) {
            window.open(currentArticle.link, '_blank', 'noopener,noreferrer');
          }
          break;
        }
        case 'm': {
          e.preventDefault();
          const currentArticle = articles[selectedIndex];
          if (currentArticle && onToggleRead) {
            onToggleRead(currentArticle);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [articles, selectedIndex, setSelectedIndex, onOpenArticle, onToggleBookmark, onToggleRead, isModalOpen]);
}
