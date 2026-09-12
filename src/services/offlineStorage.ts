import { get, set, del, values } from 'idb-keyval';
import { BookmarkedArticle, NormalizedArticle } from '@/types/wiretap';
import { db, isFirebaseConfigured } from '@/services/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const IDB_BOOKMARKS_PREFIX = 'wiretap_bookmark_';

export async function saveOfflineBookmark(
  article: NormalizedArticle,
  extractedHtml: string = '',
  leadImageUrl: string | null = null,
  readingTimeMinutes: number = 2,
  userId?: string
): Promise<BookmarkedArticle> {
  const bookmark: BookmarkedArticle = {
    id: article.id,
    title: article.title,
    author: article.author || null,
    sourceTitle: article.sourceTitle,
    originalUrl: article.link,
    publishedAt: article.pubDate,
    snippet: article.snippet,
    leadImageUrl: leadImageUrl || article.thumbnail || null,
    extractedHtml,
    readingTimeMinutes,
    savedAt: Date.now()
  };

  // 1. Save to local IndexedDB
  await set(`${IDB_BOOKMARKS_PREFIX}${bookmark.id}`, bookmark);

  // 2. Sync to Firestore if authenticated
  if (userId && isFirebaseConfigured && db) {
    try {
      const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmark.id);
      await setDoc(bookmarkRef, bookmark);
    } catch (e) {
      console.warn('Could not sync bookmark to Firestore (offline?):', e);
    }
  }

  return bookmark;
}

export async function removeOfflineBookmark(bookmarkId: string, userId?: string): Promise<void> {
  // 1. Remove from local IndexedDB
  await del(`${IDB_BOOKMARKS_PREFIX}${bookmarkId}`);

  // 2. Remove from Firestore if online
  if (userId && isFirebaseConfigured && db) {
    try {
      const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);
      await deleteDoc(bookmarkRef);
    } catch (e) {
      console.warn('Could not delete bookmark from Firestore:', e);
    }
  }
}

export async function getAllOfflineBookmarks(): Promise<BookmarkedArticle[]> {
  try {
    const all = await values();
    return (all as BookmarkedArticle[])
      .filter((b) => b && b.id && b.originalUrl)
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch (err) {
    console.error('Failed to read bookmarks from IndexedDB:', err);
    return [];
  }
}

export async function isArticleBookmarked(bookmarkId: string): Promise<boolean> {
  try {
    const item = await get(`${IDB_BOOKMARKS_PREFIX}${bookmarkId}`);
    return Boolean(item);
  } catch {
    return false;
  }
}
