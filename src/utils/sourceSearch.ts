import { CatalogFeed, POPULAR_FEEDS } from '@/data/popularFeeds';

export function isUrlLike(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return true;
  if (trimmed.includes('reddit.com/r/')) return true;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) return true;
  return false;
}

export function searchCatalog(query: string, category: string = 'All'): CatalogFeed[] {
  const cleanQuery = query.trim().toLowerCase();
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  let results = POPULAR_FEEDS;

  // 1. Filter by category
  if (category && category !== 'All') {
    results = results.filter((feed) => {
      if (category === 'Tech & AI') {
        return feed.category === 'Tech & Dev';
      }
      if (category === 'World News') {
        return feed.category === 'World News';
      }
      if (category === 'Sports & MMA') {
        return feed.category === 'Sports';
      }
      if (category === 'Finance & Crypto') {
        return feed.category === 'Finance & Biz';
      }
      if (category === 'Gaming & Esports') {
        return feed.category === 'Gaming';
      }
      if (category === 'Science & Space' || category === 'Culture & Longform') {
        return feed.category === 'Curiosity & Longform';
      }
      if (category === 'Entertainment & Movies') {
        return feed.category === 'Movies & TV';
      }
      return feed.category.toLowerCase().includes(category.toLowerCase());
    });
  }

  // 2. Filter by search query tokens if provided
  if (queryTokens.length === 0) {
    // If no query, return featured feeds first, then alphabetized
    return [...results].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  const scoredResults: { feed: CatalogFeed; score: number }[] = [];

  for (const feed of results) {
    const titleLower = feed.title.toLowerCase();
    const descLower = feed.description.toLowerCase();
    const tagsLower = feed.tags.map((t) => t.toLowerCase());
    const domainLower = feed.siteUrl.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');

    let score = 0;
    let matchesAllTokens = true;

    for (const token of queryTokens) {
      let tokenMatch = false;

      // Exact title match
      if (titleLower === cleanQuery) {
        score += 100;
        tokenMatch = true;
      } else if (titleLower.startsWith(token)) {
        score += 40;
        tokenMatch = true;
      } else if (titleLower.includes(token)) {
        score += 25;
        tokenMatch = true;
      }

      // Domain match (e.g. searching 'theverge')
      if (domainLower.includes(token)) {
        score += 20;
        tokenMatch = true;
      }

      // Tag match
      if (tagsLower.some((t) => t === token)) {
        score += 20;
        tokenMatch = true;
      } else if (tagsLower.some((t) => t.includes(token))) {
        score += 10;
        tokenMatch = true;
      }

      // Description match
      if (descLower.includes(token)) {
        score += 8;
        tokenMatch = true;
      }

      if (!tokenMatch) {
        matchesAllTokens = false;
        break;
      }
    }

    if (matchesAllTokens && score > 0) {
      if (feed.featured) score += 5;
      scoredResults.push({ feed, score });
    }
  }

  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.map((r) => r.feed);
}
