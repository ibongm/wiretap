import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { SubscribedFeed, UserPreferences } from '@/types/wiretap';
import starterFeedsRaw from '@/data/starterFeeds.json';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'slate',
  density: 'cards',
  readerFont: 'sans',
  readerFontSize: 18,
  mutedKeywords: [],
  readCutoffs: {},
  activeSort: 'newest'
};

const LOCAL_FEEDS_KEY = 'wiretap_local_feeds_';
const LOCAL_PREFS_KEY = 'wiretap_local_prefs_';

export function useUserFeeds() {
  const { userProfile, loading: authLoading } = useAuth();
  const uid = userProfile?.uid;

  const [feeds, setFeeds] = useState<SubscribedFeed[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize feeds & preferences
  useEffect(() => {
    if (authLoading) return;
    if (!uid) {
      setFeeds([]);
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    const firestore = db;

    if (!isFirebaseConfigured || !firestore) {
      // Offline / Local storage fallback mode
      const savedFeedsStr = localStorage.getItem(LOCAL_FEEDS_KEY + uid);
      const savedPrefsStr = localStorage.getItem(LOCAL_PREFS_KEY + uid);

      if (!savedFeedsStr) {
        // Seed starter feeds
        const initialFeeds: SubscribedFeed[] = starterFeedsRaw.map((f, i) => ({
          ...f,
          id: `seed_${i}_${Date.now()}`,
          healthStatus: 'healthy',
          lastFetchedAt: Date.now(),
          lastError: null
        }));
        localStorage.setItem(LOCAL_FEEDS_KEY + uid, JSON.stringify(initialFeeds));
        setFeeds(initialFeeds);
      } else {
        try {
          setFeeds(JSON.parse(savedFeedsStr));
        } catch {
          setFeeds([]);
        }
      }

      if (!savedPrefsStr) {
        localStorage.setItem(LOCAL_PREFS_KEY + uid, JSON.stringify(DEFAULT_PREFERENCES));
        setPreferences(DEFAULT_PREFERENCES);
      } else {
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(savedPrefsStr) });
        } catch {
          setPreferences(DEFAULT_PREFERENCES);
        }
      }

      setLoading(false);
      return;
    }

    // Live Firestore sync
    let unsubscribeFeeds: (() => void) | null = null;
    let unsubscribePrefs: (() => void) | null = null;

    const initFirestore = async () => {
      try {
        const feedsCol = collection(firestore, 'users', uid, 'feeds');
        const prefsDoc = doc(firestore, 'users', uid, 'settings', 'preferences');

        // Check if feeds collection is empty
        const feedsSnap = await getDocs(feedsCol);
        if (feedsSnap.empty) {
          const batch = writeBatch(firestore);
          starterFeedsRaw.forEach((f) => {
            const feedRef = doc(feedsCol);
            const feedData: SubscribedFeed = {
              ...f,
              id: feedRef.id,
              healthStatus: 'healthy',
              lastFetchedAt: Date.now(),
              lastError: null
            };
            batch.set(feedRef, feedData);
          });

          // Check if prefs doc exists
          const prefSnap = await getDoc(prefsDoc);
          if (!prefSnap.exists()) {
            batch.set(prefsDoc, DEFAULT_PREFERENCES);
          }
          await batch.commit();
        }

        // Setup real-time listener for feeds
        unsubscribeFeeds = onSnapshot(feedsCol, (snap) => {
          const items: SubscribedFeed[] = [];
          snap.forEach((d) => items.push({ ...(d.data() as SubscribedFeed), id: d.id }));
          setFeeds(items);
        });

        // Setup real-time listener for preferences
        unsubscribePrefs = onSnapshot(prefsDoc, (snap) => {
          if (snap.exists()) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...(snap.data() as UserPreferences) });
          } else {
            setDoc(prefsDoc, DEFAULT_PREFERENCES).catch(console.error);
          }
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize Firestore user data:', err);
        setLoading(false);
      }
    };

    initFirestore();

    return () => {
      if (unsubscribeFeeds) unsubscribeFeeds();
      if (unsubscribePrefs) unsubscribePrefs();
    };
  }, [uid, authLoading]);

  // Feed Operations
  const addFeed = useCallback(
    async (feedData: Omit<SubscribedFeed, 'id' | 'healthStatus' | 'lastFetchedAt' | 'lastError'>) => {
      if (!uid) return;

      const newFeed: SubscribedFeed = {
        ...feedData,
        id: 'feed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        healthStatus: 'healthy',
        lastFetchedAt: Date.now(),
        lastError: null
      };

      const firestore = db;
      if (!isFirebaseConfigured || !firestore) {
        const updated = [...feeds, newFeed];
        setFeeds(updated);
        localStorage.setItem(LOCAL_FEEDS_KEY + uid, JSON.stringify(updated));
        return newFeed;
      }

      const feedsCol = collection(firestore, 'users', uid, 'feeds');
      const newDocRef = doc(feedsCol);
      newFeed.id = newDocRef.id;
      await setDoc(newDocRef, newFeed);
      return newFeed;
    },
    [uid, feeds]
  );

  const removeFeed = useCallback(
    async (feedId: string) => {
      if (!uid) return;

      const firestore = db;
      if (!isFirebaseConfigured || !firestore) {
        const updated = feeds.filter((f) => f.id !== feedId);
        setFeeds(updated);
        localStorage.setItem(LOCAL_FEEDS_KEY + uid, JSON.stringify(updated));
        return;
      }

      const feedRef = doc(firestore, 'users', uid, 'feeds', feedId);
      await deleteDoc(feedRef);
    },
    [uid, feeds]
  );

  const updateFeed = useCallback(
    async (feedId: string, partial: Partial<SubscribedFeed>) => {
      if (!uid) return;

      const firestore = db;
      if (!isFirebaseConfigured || !firestore) {
        const updated = feeds.map((f) => (f.id === feedId ? { ...f, ...partial } : f));
        setFeeds(updated);
        localStorage.setItem(LOCAL_FEEDS_KEY + uid, JSON.stringify(updated));
        return;
      }

      const feedRef = doc(firestore, 'users', uid, 'feeds', feedId);
      await updateDoc(feedRef, partial);
    },
    [uid, feeds]
  );

  const batchAddFeeds = useCallback(
    async (newFeeds: Array<Omit<SubscribedFeed, 'id' | 'healthStatus' | 'lastFetchedAt' | 'lastError'>>) => {
      if (!uid || newFeeds.length === 0) return;

      // Filter out feeds that already exist by URL
      const existingUrls = new Set(feeds.map((f) => f.feedUrl.toLowerCase().trim()));
      const toAdd = newFeeds.filter((f) => !existingUrls.has(f.feedUrl.toLowerCase().trim()));

      if (toAdd.length === 0) return;

      const firestore = db;
      if (!isFirebaseConfigured || !firestore) {
        const createdFeeds: SubscribedFeed[] = toAdd.map((f) => ({
          ...f,
          id: 'feed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          healthStatus: 'healthy',
          lastFetchedAt: Date.now(),
          lastError: null
        }));
        const updated = [...feeds, ...createdFeeds];
        setFeeds(updated);
        localStorage.setItem(LOCAL_FEEDS_KEY + uid, JSON.stringify(updated));
        return;
      }

      const batch = writeBatch(firestore);
      const feedsCol = collection(firestore, 'users', uid, 'feeds');

      toAdd.forEach((f) => {
        const docRef = doc(feedsCol);
        const feedRecord: SubscribedFeed = {
          ...f,
          id: docRef.id,
          healthStatus: 'healthy',
          lastFetchedAt: Date.now(),
          lastError: null
        };
        batch.set(docRef, feedRecord);
      });

      await batch.commit();
    },
    [uid, feeds]
  );

  // Preferences Operations
  const updatePreferences = useCallback(
    async (partial: Partial<UserPreferences>) => {
      if (!uid) return;

      const merged = { ...preferences, ...partial };
      setPreferences(merged);

      const firestore = db;
      if (!isFirebaseConfigured || !firestore) {
        localStorage.setItem(LOCAL_PREFS_KEY + uid, JSON.stringify(merged));
        return;
      }

      const cleanPartial = Object.fromEntries(
        Object.entries(partial).filter(([_, v]) => v !== undefined)
      );
      const prefsDoc = doc(firestore, 'users', uid, 'settings', 'preferences');
      await setDoc(prefsDoc, cleanPartial, { merge: true });
    },
    [uid, preferences]
  );

  const markCategoryAsRead = useCallback(
    async (categoryId: string) => {
      const now = Date.now();
      const updatedCutoffs = {
        ...(preferences.readCutoffs || {}),
        [categoryId]: now
      };
      await updatePreferences({ readCutoffs: updatedCutoffs });
    },
    [preferences.readCutoffs, updatePreferences]
  );

  const markArticleAsRead = useCallback(
    async (articleId: string) => {
      const current = new Set(preferences.readArticleIds || []);
      if (!current.has(articleId)) {
        current.add(articleId);
        const list = Array.from(current).slice(-2000);
        await updatePreferences({ readArticleIds: list });
      }
    },
    [preferences.readArticleIds, updatePreferences]
  );

  const toggleArticleRead = useCallback(
    async (articleId: string) => {
      const current = new Set(preferences.readArticleIds || []);
      if (current.has(articleId)) {
        current.delete(articleId);
      } else {
        current.add(articleId);
      }
      await updatePreferences({ readArticleIds: Array.from(current).slice(-2000) });
    },
    [preferences.readArticleIds, updatePreferences]
  );

  const toggleHideRead = useCallback(
    async () => {
      await updatePreferences({ hideRead: !preferences.hideRead });
    },
    [preferences.hideRead, updatePreferences]
  );

  return {
    feeds,
    preferences,
    loading,
    addFeed,
    removeFeed,
    updateFeed,
    batchAddFeeds,
    updatePreferences,
    markCategoryAsRead,
    markArticleAsRead,
    toggleArticleRead,
    toggleHideRead
  };
}
