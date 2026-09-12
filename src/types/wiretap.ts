export interface UserProfile {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: number;
}

export interface UserPreferences {
  theme: 'oled' | 'slate' | 'editorial' | 'light';
  density: 'cards' | 'compact' | 'minimal';
  readerFont: 'serif' | 'sans';
  readerFontSize: number; // default 18 (px)
  mutedKeywords: string[]; // Bullshit filter
  readCutoffs: Record<string, number>; // { [categoryIdOrFeedId]: unixTimestamp }
  readArticleIds?: string[]; // Per-article read tracking
  hideRead?: boolean; // Filter out read articles
  activeSort: 'newest' | 'oldest' | 'source';
}

export interface SubscribedFeed {
  id: string; // Firestore document ID
  title: string;
  feedUrl: string;
  siteUrl: string;
  category: string;
  tags: string[];
  faviconUrl: string;
  healthStatus: 'healthy' | 'failing';
  lastFetchedAt: number;
  lastError?: string | null;
}

export interface NormalizedArticle {
  id: string; // Hash of link/guid
  feedId?: string;
  sourceTitle: string;
  title: string;
  link: string;
  pubDate: number; // Unix timestamp in ms or seconds
  author?: string;
  snippet: string;
  contentHtml?: string; // Full rich HTML content if present in feed
  thumbnail?: string;
  faviconUrl?: string;
  smartTags?: string[];
}

export interface BookmarkedArticle {
  id: string; // Hash of original URL
  title: string;
  author: string | null;
  sourceTitle: string;
  originalUrl: string;
  publishedAt: number;
  snippet: string;
  leadImageUrl: string | null;
  extractedHtml: string; // Extracted clean article content
  readingTimeMinutes: number;
  savedAt: number;
}

export interface ApiFeedResponse {
  ok: boolean;
  feed?: {
    title: string;
    siteUrl: string;
    description?: string;
    items: NormalizedArticle[];
  };
  error?: string;
}

export interface ApiDiscoverCandidate {
  title: string;
  url: string;
  type: string;
  siteUrl?: string;
  faviconUrl?: string;
}

export interface ApiDiscoverResponse {
  ok: boolean;
  feeds?: ApiDiscoverCandidate[];
  error?: string;
}

export interface ExtractedArticleData {
  title: string;
  author: string | null;
  content: string;
  leadImageUrl: string | null;
  publishedAt: number;
  readingTimeMinutes: number;
  sourceTitle?: string;
  url?: string;
}

export interface ApiArticleResponse {
  ok: boolean;
  article?: ExtractedArticleData;
  error?: string;
}
