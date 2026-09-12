import { get, set, del, values } from 'idb-keyval';
import { BookmarkedArticle, NormalizedArticle } from '@/types/wiretap';
import { db, isFirebaseConfigured } from '@/services/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const IDB_BOOKMARKS_PREFIX = 'wiretap_bookmark_';

export async function saveOfflineBookmark(
  article: NormalizedArticle,
  extractedHtml: string = '',
  leadImageUrl: string | null = null,
  readingTimeMinutes: number = 2,
  userId?: string
): Promise<BookmarkedArticle> {
  const content = extractedHtml || article.contentHtml || (article.snippet ? `<p>${article.snippet}</p>` : '');

  const bookmark: BookmarkedArticle = {
    id: article.id,
    title: article.title,
    author: article.author || null,
    sourceTitle: article.sourceTitle,
    originalUrl: article.link,
    publishedAt: article.pubDate,
    snippet: article.snippet,
    leadImageUrl: leadImageUrl || article.thumbnail || null,
    extractedHtml: content,
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

  // 3. If full HTML wasn't already available and we have network, background-extract it
  if (!extractedHtml && !article.contentHtml && typeof window !== 'undefined' && navigator.onLine && article.link) {
    fetch(`/api/article?url=${encodeURIComponent(article.link)}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.ok && data.article?.content) {
          bookmark.extractedHtml = data.article.content;
          if (data.article.leadImageUrl) bookmark.leadImageUrl = data.article.leadImageUrl;
          if (data.article.readingTimeMinutes) bookmark.readingTimeMinutes = data.article.readingTimeMinutes;
          await set(`${IDB_BOOKMARKS_PREFIX}${bookmark.id}`, bookmark);
          if (userId && isFirebaseConfigured && db) {
            const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmark.id);
            await setDoc(bookmarkRef, bookmark);
          }
        }
      })
      .catch(() => {
        // Fallback content already saved
      });
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

export async function getAllBookmarkIds(): Promise<Set<string>> {
  try {
    const all = await getAllOfflineBookmarks();
    return new Set(all.map((b) => b.id));
  } catch {
    return new Set();
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

export async function syncCloudBookmarks(userId: string): Promise<BookmarkedArticle[]> {
  if (!userId || !isFirebaseConfigured || !db) {
    return getAllOfflineBookmarks();
  }

  try {
    const colRef = collection(db, 'users', userId, 'bookmarks');
    const snap = await getDocs(colRef);
    const cloudBookmarks: BookmarkedArticle[] = [];
    snap.forEach((d) => {
      cloudBookmarks.push(d.data() as BookmarkedArticle);
    });

    for (const b of cloudBookmarks) {
      await set(`${IDB_BOOKMARKS_PREFIX}${b.id}`, b);
    }

    return getAllOfflineBookmarks();
  } catch (err) {
    console.warn('Failed to sync cloud bookmarks:', err);
    return getAllOfflineBookmarks();
  }
}
