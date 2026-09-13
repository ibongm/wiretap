# Changelog

All notable changes to the Wiretap project will be documented in this file.

### [2026-09-13] - Harden Vite Watcher with Polling for Windows File System
- **Files Changed**:
  - `vite.config.ts` (Modified)
- **Details**:
  - Configured `server.watch.usePolling` with an 800ms interval in `vite.config.ts` to prevent Windows filesystem `EBUSY` crashes when screenshots, assets, or images are written or downloaded into the `public/` directory.

### [2026-09-13] - PWA Screenshots, Standardized Icons & Manifest Expansion
- **Files Changed**:
  - `public/apple-touch-icon.png` (Created)
  - `public/favicon.ico` (Created)
  - `public/pwa-192x192.png` (Created)
  - `public/pwa-512x512.png` (Created)
  - `public/screenshot-desktop.png` (Created)
  - `public/screenshot-desktop1.png` (Created)
  - `public/screenshot-desktop2.png` (Created)
  - `public/screenshot-mobile.png` (Created)
  - `vite.config.ts` (Modified)
- **Details**:
  - Added desktop and mobile promotional screenshots (`screenshot-desktop.png`, `screenshot-mobile.png`, `screenshot-desktop1.png`, `screenshot-desktop2.png`) for rich PWA app store install previews.
  - Added standardized PWA manifest icons (`pwa-192x192.png`, `pwa-512x512.png`), `apple-touch-icon.png`, and `favicon.ico`.
  - Expanded `VitePWA` manifest in `vite.config.ts` with categories (`news`, `magazines`, `productivity`), orientation, and maskable icons, while preserving `apiDevPlugin` for seamless local API route execution.

### [2026-09-13] - High-Resolution PWA App Icons & Web Manifest Integration
- **Files Changed**:
  - `public/wiretap-logo 192x192.png` (Created)
  - `public/wiretap-logo 512x512.png` (Created)
  - `public/wiretap-logo-192x192.png` (Created)
  - `public/wiretap-logo-512x512.png` (Created)
  - `index.html` (Modified)
  - `vite.config.ts` (Modified)
- **Details**:
  - Added dedicated 192x192 and 512x512 high-resolution brand icons for mobile home screen and desktop PWA installation.
  - Configured `VitePWA` in `vite.config.ts` to include high-res icons in web app manifest and precache table.
  - Updated `index.html` `apple-touch-icon` reference to the 192x192 high-resolution icon for crisp iOS bookmarking.

### [2026-09-13] - Bug Fixes: Browser Shortcut Conflicts, TTS Leaks, Relative Scraped URLs & Sync
- **Files Changed**:
  - `api/article.ts` (Modified)
  - `api/discover.ts` (Modified)
  - `api/feed.ts` (Modified)
  - `src/App.tsx` (Modified)
  - `src/components/bookmarks/BookmarksView.tsx` (Modified)
  - `src/components/feed/Firehose.tsx` (Modified)
  - `src/components/layout/Shell.tsx` (Modified)
  - `src/components/reader/ReaderDrawer.tsx` (Modified)
  - `src/hooks/useKeyboardShortcuts.ts` (Modified)
  - `src/hooks/useUserFeeds.ts` (Modified)
- **Details**:
  - **Browser Shortcut Conflict Prevention**: Ignored modifier keys (`e.metaKey`, `e.ctrlKey`, `e.altKey`) in `src/hooks/useKeyboardShortcuts.ts` to prevent Wiretap keybindings from hijacking default browser actions (`Ctrl+B` for bookmarks, `Ctrl+J` for downloads, `Ctrl+O` for open file).
  - **Web Speech Synthesis Cleanup**: Added cleanup `useEffect` in `src/components/reader/ReaderDrawer.tsx` that calls `window.speechSynthesis.cancel()` whenever the reader drawer is closed or unmounted, preventing zombie audio narration.
  - **Relative URL Resolution for Scraped Articles**: Updated `sanitizeWithCheerio` and metadata extraction in `api/article.ts` to resolve relative `href`, relative `img src`, and relative `leadImage` against the target article's base URL, eliminating 404 image errors and broken in-article links.
  - **URI Decoding Hardening**: Protected `api/feed.ts` and `api/article.ts` against `URIError: URI malformed` and double-decoding on already decoded incoming query parameters.
  - **Discovery SSRF & Favicon Error Handling**: Validated candidate feed URLs against `isSafeUrl` in `api/discover.ts` and wrapped favicon resolution in `try...catch` to prevent serverless function crashes on malformed icon paths.
  - **Cross-View Bookmark State Sync**: Added `bookmarkVersion` and `handleBookmarkChanged` in `src/App.tsx`, wired into `Firehose.tsx`, `BookmarksView.tsx`, and `ReaderDrawer.tsx`, ensuring offline bookmarks stay 100% synchronized across all views without requiring pagination changes.
  - **Sidebar Active State Correction**: Updated `src/components/layout/Shell.tsx` to verify `!selectedFeedId` before highlighting the "Full Firehose" button, preventing dual-selection states when viewing a single publication.
  - **Firestore Undefined Field Crash Protection**: Stripped `undefined` properties in `src/hooks/useUserFeeds.ts` before passing partial updates to Firestore `setDoc(..., { merge: true })`.
  - **Firehose Performance & Regex Escaping**: Replaced linear $O(N)$ read state scans with memoized $O(1)$ `readSet.has(article.id)` lookups across Cards, Compact, and Minimalist modes in `src/components/feed/Firehose.tsx`, and used `escapeRegExp` in the keyword mute filter to safely match terms with symbols (`c++`, `node.js`).

### [2026-09-13] - Comprehensive UX, Offline Storage, SSRF Hardening & Reader Enhancements
- **Files Changed**:
  - `api/article.ts` (Modified)
  - `api/discover.ts` (Modified)
  - `api/feed.ts` (Modified)
  - `package.json` (Modified)
  - `package-lock.json` (Modified)
  - `README.md` (Modified)
  - `src/App.tsx` (Modified)
  - `src/components/bookmarks/BookmarksView.tsx` (Modified)
  - `src/components/feed/Firehose.tsx` (Modified)
  - `src/components/layout/Shell.tsx` (Modified)
  - `src/components/reader/ReaderDrawer.tsx` (Modified)
  - `src/components/settings/OpmlManager.tsx` (Modified)
  - `src/hooks/useUserFeeds.ts` (Modified)
  - `src/index.css` (Modified)
  - `src/services/offlineStorage.ts` (Modified)
  - `src/types/wiretap.ts` (Modified)
- **Details**:
  - **OPML Import Crash Fix**: Guarded OPML XML parsing with `try...catch` and fallback to Google favicon service in `src/components/settings/OpmlManager.tsx`, eliminating unhandled `Invalid URL` runtime errors on relative or malformed feed links.
  - **SSRF Protection**: Implemented strict private/loopback IP validation in `api/feed.ts`, `api/article.ts`, and `api/discover.ts` blocking `127.0.0.1`, `localhost`, `169.254.169.254` (cloud metadata), and RFC 1918 private subnets (`10.*`, `192.168.*`, `172.16-31.*`).
  - **Feed Full-Text Retention**: Extended `api/feed.ts` to capture `<content:encoded>` and full HTML content as `contentHtml` on `NormalizedArticle`, allowing immediate, scraper-free article rendering in `ReaderDrawer.tsx`.
  - **Theme System Contrast & Visibility**: Fixed pure-white card backgrounds breaking in Warm Editorial, Pure Light, OLED Black, and Slate themes by scoping `.theme-editorial article`, `.theme-light article`, and form controls with appropriate background, border, and text variables in `src/index.css`.
  - **Dynamic Reader Prose Styling**: Removed hardcoded `prose-invert` in `src/components/reader/ReaderDrawer.tsx` and dynamically bound prose typography classes to current theme (`prose-invert` for dark/oled/slate, standard prose for light/editorial).
  - **Reader Drawer Features**: Added Web Speech API text-to-speech narration toggle (`Volume2`/`VolumeX`), Web Share API integration with clipboard fallback, background body scroll lock (`overflow-hidden`), persistent font size & serif/sans typography preferences in `localStorage`, and automated read status tracking.
  - **Read State & Hide Read Filtering**: Added `readArticleIds` and `hideRead` to `UserPreferences` in `src/types/wiretap.ts` and `src/hooks/useUserFeeds.ts`. Implemented instant read status toggling (`CheckCircle2`) and desktop/mobile "Hide Read" visibility toggles in `Firehose.tsx` and `Shell.tsx`.
  - **Live Keyboard Shortcuts & Smooth Scrolling**: Reconnected `useKeyboardShortcuts` directly inside `src/components/feed/Firehose.tsx` using active `processedArticles`, and bound smooth auto-scroll into view via dynamic `articleRefs` on `j` (next), `k` (previous), `Enter` (open reader), `b` (bookmark), `o` (open external), and `m` (toggle read).
  - **IndexedDB Batch Performance & Two-Way Sync**: Added `getAllBookmarkIds()` in `src/services/offlineStorage.ts` to replace sequential per-article IDB reads with a single batch `idb-keyval` keys lookup. Added background full-text caching when saving bookmarks and two-way Cloud Firestore synchronization (`syncCloudBookmarks`) for authenticated users in `src/components/bookmarks/BookmarksView.tsx`.
  - **Search Debouncing**: Added 150ms debouncing on search input in `src/components/layout/Shell.tsx` to prevent CPU re-render thrashing during rapid keystrokes.
  - **Dependency Pruning**: Removed dead and unused dependencies (`@extractus/article-extractor`, `sanitize-html`, `@types/sanitize-html`, `clsx`, `tailwind-merge`) from `package.json` and `package-lock.json`, shrinking bundle size and eliminating dead imports.

### [2026-09-13] - Custom Distressed Stencil Brand Logo & Icon Integration
- **Files Changed**:
  - `public/wiretap-logo.png` (Created)
  - `public/wiretap-icon.png` (Created)
  - `src/components/layout/Shell.tsx` (Modified)
  - `index.html` (Modified)
- **Details**:
  - Processed raw high-res user artwork into high-definition transparent PNG assets (`public/wiretap-logo.png` wordmark and `public/wiretap-icon.png` square "W" mark) with smooth alpha transparency, eliminating white paper backgrounds and rendering distressed stencil typography in silver-white (`#F1F5F9`).
  - Replaced generic Lucide RSS square icon and plain font text in both the sidebar brand header and the top navigation bar with the custom distressed stencil wordmark.
  - Added ambient indigo neon drop-shadow glow (`drop-shadow-[0_0_10px_rgba(99,102,241,0.25)]`) and interactive hover glow effects to match Wiretap's cyberpunk intelligence theme.
  - Implemented responsive collapsed sidebar state displaying the distressed "W" stencil mark in a glass container.
  - Updated `index.html` and apple-touch-icon with the custom `wiretap-icon.png` mark.

### [2026-09-13] - Deduplicate Reader Lead Image & Fix Category/Source Filtering
- **Files Changed**:
  - `api/article.ts` (Modified)
  - `src/components/reader/ReaderDrawer.tsx` (Modified)
  - `src/components/layout/Shell.tsx` (Modified)
  - `src/components/feed/Firehose.tsx` (Modified)
  - `src/App.tsx` (Modified)
- **Details**:
  - Resolved cascading state wipeout bug in `Shell.tsx` where selecting a category or subscribed feed immediately triggered adjacent `null` resets in `App.tsx`. Click handlers now only invoke their dedicated callback and support toggle-off deselecting.
  - Added case-insensitive category matching (`.trim().toLowerCase()`) in `Firehose.tsx` to ensure category filters accurately capture all assigned feeds.
  - Enabled clickable publisher names and topic tag badges directly on article cards in Cards, Compact, and Minimalist stream modes in `Firehose.tsx`.
  - Eliminated duplicate lead photos in the Reader Drawer: both server-side (`api/article.ts`) and client-side (`ReaderDrawer.tsx`) detect if the lead hero photo matches or precedes the article body, removing redundant stacked `<figure>` or `<img>` elements before rendering prose typography.
  - Added graceful `onError` fallback hiding on hero images in `ReaderDrawer.tsx`.

### [2026-09-13] - Feed Thumbnails, Publisher Favicon Fallbacks, Smart Topic Tags & Mobile Toolbar
- **Files Changed**:
  - `api/feed.ts` (Modified)
  - `src/types/wiretap.ts` (Modified)
  - `src/utils/smartTags.ts` (Created)
  - `src/components/layout/Shell.tsx` (Modified)
  - `src/components/feed/Firehose.tsx` (Modified)
  - `src/App.tsx` (Modified)
- **Details**:
  - Added `rawContent` and `rawDescription` custom fields in `api/feed.ts` to capture unstripped `<img>` tags inside `<content>` and `<description>` (resolving missing thumbnails for Index.hr and regional publishers).
  - Derived high-resolution publisher favicon URLs (`faviconUrl`) in `api/feed.ts` and attached them to normalized articles and feed subscriptions.
  - Replaced the two-letter monogram fallback (`IN`, `FA`) in `Firehose.tsx` with high-resolution publisher favicon badges and brand containers across Cards and Compact modes.
  - Built `src/utils/smartTags.ts` topic classifier matching headlines and snippets against curated domain keywords (`AI`, `Space`, `Sports`, `Politics`, `Cybersecurity`, `Tech & Gadgets`, `Economy & Biz`, `Science`, `Entertainment`).
  - Reordered the sidebar in `Shell.tsx` to position Subscribed Feeds above Topic Tags, and made each subscribed feed clickable to isolate news from that specific publisher.
  - Rebranded the main header from "Firehose" to "WIRETAP" with a designated logo slot and dynamic breadcrumb paths (`WIRETAP / Publication`, `WIRETAP / Category`, or `WIRETAP / #Tag`).
  - Added responsive sub-header mobile toolbar in `Shell.tsx` exposing sorting controls (`Newest First`, `Oldest First`, `Group by Source`) and keyword search on mobile devices.
  - Updated search input placeholder to "Search headlines and keywords..." while retaining regular expression filtering support.

### [2026-09-12] - Pure Cheerio Article Extraction and Sanitization
- **Files Changed**:
  - `api/article.ts` (Modified)
- **Details**:
  - Replaced `sanitize-html` dependency in `api/article.ts` with custom `sanitizeWithCheerio` traversal to prevent Vercel Serverless module resolution crashes (`FUNCTION_INVOCATION_FAILED`).
  - Implemented stripping of scripts, inline styles, stylesheets, event handler attributes (`on*`), and dangerous link protocols (`javascript:`).
  - Hardened external links with `target="_blank"` and `rel="noopener noreferrer"`, and added lazy loading for inline article images.

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
