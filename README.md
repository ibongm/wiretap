# Wiretap — Editorial Intelligence Engine

> High-performance, high-density personal news aggregator engineered for speed, editorial autonomy, and zero-distraction reading.

![Wiretap Screenshot or Banner](public/favicon.svg)

---

## 🌟 Overview

Wiretap combines the syndication power of RSS, Atom, and JSON feeds with a two-tier content extraction pipeline and client-side edge caching.

- **Ephemeral Firehose:** Live feed streams are dynamically fetched in parallel via TanStack Query and kept in-memory.
- **Quota-Safe Firestore Persistence:** Firestore stores only user state (subscriptions, category read cutoffs, and preferences).
- **Offline Reading Vault:** Bookmarked articles cache full extracted HTML and lead imagery into local IndexedDB (`idb-keyval`).
- **Bullshit Filter:** Client-side regex keyword mute list that scrubs distracting headlines in real-time.
- **Tri-State Density Engine:** Magazine Cards, Compact Scan List, and Minimalist Headlines.
- **Power-User Shortcuts:** Keyboard navigation (`j`, `k`, `Enter`, `b`, `o`, `m`).
- **Multi-Palette Themes:** OLED Pitch, Dark Slate, Warm Editorial, and Pure Light.

---

## 🛠️ Tech Stack

- **Frontend:** React 18 (TypeScript), Vite, Tailwind CSS, `@tailwindcss/typography`, Lucide React
- **State & Data:** TanStack Query (`@tanstack/react-query`), IndexedDB (`idb-keyval`)
- **Backend / Edge:** Vercel Serverless Functions (`/api`), Node.js, `rss-parser`, `cheerio`
- **Identity & Persistence:** Firebase Auth (Anonymous, Google OAuth, Email/Password), Cloud Firestore
- **PWA:** `vite-plugin-pwa` with service worker caching

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
Wiretap features a built-in development API middleware that serves both the frontend and `/api` serverless endpoints with hot reloading:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Firebase project credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*(Note: If omitted, Wiretap runs in a fully functional offline local guest mode).*

---

## 📡 Serverless API Endpoints

- `GET /api/feed?url=<encoded-url>` — Parses and normalizes RSS/Atom XML feeds with edge caching headers (`s-maxage=600, stale-while-revalidate=1200`).
- `POST /api/discover` — Auto-discovers feeds from website URLs, Reddit (`r/sub`), and YouTube channels (`@channel`).
- `POST /api/article` — Extracts readable article body, strips tracking scripts, sanitizes HTML, and estimates reading time.
- `POST /api/opml` — Exports user subscriptions to OPML 2.0 or imports OPML files with deduplication.

---

## ⌨️ Power-User Shortcuts

| Key | Action |
| :--- | :--- |
| `j` | Move selection down through firehose |
| `k` | Move selection up through firehose |
| `Enter` / `Space` | Open article in in-app Reader Drawer |
| `b` | Toggle bookmark (saves full text to IndexedDB) |
| `o` | Open original article in new browser tab |
| `m` | Toggle article read status |
| `Esc` | Close reader drawer or open modal |

---

## 📦 Deployment

### Deploying to Vercel
1. Push repository to GitHub.
2. Import project into Vercel Dashboard (framework preset: Vite).
3. Add the 6 Firebase environment variables in Vercel project settings.
4. Deploy!
