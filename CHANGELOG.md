# Changelog

All notable changes to the Wiretap project will be documented in this file.

### [2026-09-12] - Serverless-Native Article Extractor & GET Endpoint
- **Files Changed**:
  - `api/article.ts` (Modified)
  - `src/components/reader/ReaderDrawer.tsx` (Modified)
- **Details**:
  - Migrated `/api/article` from `@extractus/article-extractor` to native `cheerio` + `sanitize-html` to eliminate `linkedom` serverless crashes (`FUNCTION_INVOCATION_FAILED`).
  - Added query parameter `GET /api/article?url=...` support with Edge Caching headers (`s-maxage=3600`), resolving POST preflight and CORS redirect issues.
  - Updated `ReaderDrawer.tsx` to query `/api/article?url=...` via GET, delivering instant full-text article extraction.

### [2026-09-12] - Article Extraction Resilience & Vercel Routing Hardening
- **Files Changed**:
  - `package.json` (Modified)
  - `vercel.json` (Modified)
  - `api/article.ts` (Modified)
  - `src/components/reader/ReaderDrawer.tsx` (Modified)
- **Details**:
  - Added Node.js >=20 engine requirement in `package.json` for serverless runtime compatibility with readability/linkedom.
  - Hardened `vercel.json` rewrite configuration with negative lookahead `/((?!api/.*).*)` to preserve native Serverless execution for `/api/*` routes.
  - Added 6.5s timeout race in `api/article.ts` to prevent Vercel 10s lambda cutoff, plus Cheerio DOM fallback extraction for sites blocking article-extractor.
  - Refactored `ReaderDrawer.tsx` to safely handle non-JSON responses and display styled syndicated RSS dispatch summaries when publishers protect full text behind anti-bot barriers.

### [2026-09-12] - Remove Regional Feeds from Default Subscriptions
- **Files Changed**:
  - `src/data/starterFeeds.json` (Modified)
  - `src/components/auth/AuthModal.tsx` (Modified)
- **Details**:
  - Removed `Index.hr` and `Telegram.hr` regional news sources from the starter feeds manifest, reducing default seeds to 14 global feeds.
  - Updated AuthModal copy to refer to subscriptions generally.

### [2026-09-12] - Documentation & GitHub Repository Preparation
- **Files Changed**:
  - `README.md` (Created)
  - `.gitignore` (Modified)
- **Details**:
  - Added comprehensive project documentation covering architecture overview, tech stack, local development, environment configuration, serverless API specifications, power-user shortcuts table, and Vercel deployment instructions.
  - Added `*.tsbuildinfo` build artifact exclusion to `.gitignore`.

### [2026-09-12] - Client Engine, Reader Drawer, Themes & Offline Vault (Phases 3 - 5)
- **Files Changed**:
  - `src/services/offlineStorage.ts` (Created)
  - `src/context/ThemeContext.tsx` (Created)
  - `src/hooks/useKeyboardShortcuts.ts` (Created)
  - `src/components/reader/ReaderDrawer.tsx` (Created)
  - `src/components/feed/Firehose.tsx` (Created)
  - `src/components/bookmarks/BookmarksView.tsx` (Created)
  - `src/components/feed/AddFeedModal.tsx` (Created)
  - `src/components/settings/OpmlManager.tsx` (Created)
  - `src/components/settings/SettingsModal.tsx` (Created)
  - `src/components/layout/Shell.tsx` (Created)
  - `src/index.css` (Created)
  - `src/App.tsx` (Created)
  - `src/main.tsx` (Created)
- **Details**:
  - Implemented responsive three-column `Shell` with collapsible sidebar, real-time unread/category filters, and density toggles.
  - Built `Firehose` multi-feed engine using TanStack Query parallel fetching, deduplication, timestamp cutoffs, regex Bullshit Filter, and 3 density layouts (Cards, Compact, Minimal).
  - Built `ReaderDrawer` slide-over modal with typography controls (sans/serif), font-sizing (14-26px), reading time indicators, scroll progress line, and sanitized prose rendering.
  - Implemented 4 theme palettes: OLED Pitch, Dark Slate, Warm Editorial, and Pure Light via `ThemeContext`.
  - Added power-user keyboard navigation hook (`j`, `k`, `Enter`, `b`, `o`, `m`).
  - Added IndexedDB offline reading engine using `idb-keyval` and dedicated `BookmarksView`.
  - Added `AddFeedModal` with smart URL feed discovery and tag assignment.
  - Added `OpmlManager` with OPML 2.0 XML export and deduplicated import.

### [2026-09-12] - Firebase Tri-Auth, Persistence & Starter Feeds (Phase 2)
- **Files Changed**:
  - `firestore.rules` (Created)
  - `src/data/starterFeeds.json` (Created)
  - `src/services/firebase.ts` (Created)
  - `src/context/AuthContext.tsx` (Created)
  - `src/hooks/useUserFeeds.ts` (Created)
  - `src/components/auth/AuthModal.tsx` (Created)
- **Details**:
  - Configured Firebase Authentication with Tri-Auth support (Anonymous Guest, Google OAuth, Email/Password) and seamless account upgrading/linking.
  - Added curated 16 starter feeds manifest across 6 categories (World News, Tech & Dev, Movies & TV, Sports, Curiosity & Longform, Regional News).
  - Built `useUserFeeds` hook providing batch write auto-seeding on initial session, real-time Firestore listeners, preferences synchronization, and offline fallback mode.
  - Implemented Firestore security rules restricting read/write access strictly to authenticated document owners.
  - Built `AuthModal` with account upgrade banners, Google login, and credentials management.

### [2026-09-12] - Serverless API Endpoints & Core Data Models (Phase 1)
- **Files Changed**:
  - `api/feed.ts` (Created)
  - `api/discover.ts` (Created)
  - `api/article.ts` (Created)
  - `api/opml.ts` (Created)
  - `src/types/wiretap.ts` (Created)
- **Details**:
  - Implemented `/api/feed.ts` with RSS/Atom XML parsing, custom Media RSS thumbnail extraction, article normalization, and Edge Caching headers.
  - Implemented `/api/discover.ts` with auto-resolution for Reddit subreddits, YouTube channels, and HTML `<link rel="alternate">` feed detection.
  - Implemented `/api/article.ts` with semantic HTML cleanup via sanitize-html, reading time estimation, and metadata extraction.
  - Implemented `/api/opml.ts` with OPML 2.0 XML import and category-grouped export.
  - Defined TypeScript contracts for UserProfile, UserPreferences, SubscribedFeed, NormalizedArticle, and BookmarkedArticle.

### [2026-09-12] - Project Initialization & Base Configuration
- **Files Changed**:
  - `CHANGELOG.md` (Created)
  - `package.json` (Created)
  - `tsconfig.json` (Created)
  - `tsconfig.node.json` (Created)
  - `vite.config.ts` (Created)
  - `tailwind.config.js` (Created)
  - `postcss.config.js` (Created)
  - `index.html` (Created)
  - `vercel.json` (Created)
  - `.env.example` (Created)
  - `.gitignore` (Created)
- **Details**:
  - Initialized project scaffolding for Wiretap news aggregator.
  - Configured Vite with React, Tailwind CSS, Typography plugin, and PWA plugin.
  - Added full dependency tree including React Query, Lucide icons, Firebase SDK, idb-keyval, date-fns, and serverless RSS/scraping libraries (rss-parser, @extractus/article-extractor, sanitize-html, cheerio).
  - Configured Vercel serverless routing in `vercel.json` and local dev API middleware in `vite.config.ts`.
