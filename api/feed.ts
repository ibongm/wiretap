import Parser from 'rss-parser';
import crypto from 'crypto';

interface CustomFeedItem {
  [key: string]: any;
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  guid?: string;
  isoDate?: string;
  'media:content'?: {
    $?: {
      url?: string;
      medium?: string;
    };
  };
  'media:thumbnail'?: {
    $?: {
      url?: string;
    };
  };
  enclosure?: {
    url?: string;
    type?: string;
    length?: number;
  };
  'content:encoded'?: string;
  rawContent?: string;
  rawDescription?: string;
}

const parser = new Parser<Record<string, unknown>, CustomFeedItem>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded'],
      ['content', 'rawContent', { keepArray: false }],
      ['description', 'rawDescription', { keepArray: false }]
    ]
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Wiretap/1.0',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html;q=0.9, */*;q=0.8'
  },
  timeout: 10000
});

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImageFromHtml(html?: string): string | undefined {
  if (!html) return undefined;
  // Match src in <img> tag, handling single, double or unquoted attributes
  const match = html.match(/<img[^>]+src=["']?([^"'>\s]+)["']?/i);
  if (!match) return undefined;
  const src = match[1];
  // Filter out tiny 1x1 tracking beacons / spacer gifs
  if (src.includes('1x1') || src.includes('tracking') || src.includes('beacon') || src.includes('pixel')) {
    return undefined;
  }
  return src;
}

function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  // Edge Caching headers
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = (req.query?.url as string) || '';
  if (!rawUrl) {
    return res.status(400).json({ ok: false, error: 'Missing required query parameter "url"' });
  }

  try {
    let feedUrl = rawUrl.trim();
    if (/^https?%3A/i.test(feedUrl)) {
      try {
        feedUrl = decodeURIComponent(feedUrl);
      } catch {
        // keep feedUrl
      }
    }

    if (!isSafeUrl(feedUrl)) {
      return res.status(400).json({ ok: false, error: 'Invalid or forbidden feed URL.' });
    }

    const parsedFeed = await parser.parseURL(feedUrl);

    const siteUrl = parsedFeed.link || new URL(feedUrl).origin;
    const feedTitle = parsedFeed.title || 'Untitled Feed';

    let domain = '';
    try {
      domain = new URL(siteUrl).hostname;
    } catch {
      try {
        domain = new URL(feedUrl).hostname;
      } catch {
        domain = '';
      }
    }
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : undefined;

    const items = (parsedFeed.items || []).map((item) => {
      const link = item.link || item.guid || '';
      const id = hashString(link || item.title || Math.random().toString());

      // Extract thumbnail with multiple fallbacks
      let thumbnail =
        item['media:thumbnail']?.$?.url ||
        item['media:content']?.$?.url;

      if (!thumbnail && item.enclosure?.url) {
        const encType = item.enclosure.type || '';
        const encUrl = item.enclosure.url;
        if (encType.startsWith('image') || /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(encUrl)) {
          thumbnail = encUrl;
        }
      }

      if (!thumbnail) {
        thumbnail =
          extractImageFromHtml(item['content:encoded']) ||
          extractImageFromHtml(item.rawContent) ||
          extractImageFromHtml(item.rawDescription) ||
          extractImageFromHtml(item.content) ||
          extractImageFromHtml(item.description) ||
          extractImageFromHtml(item.summary) ||
          extractImageFromHtml(item.contentSnippet);
      }

      // Format pubDate
      let pubDate = Date.now();
      if (item.isoDate) {
        pubDate = new Date(item.isoDate).getTime();
      } else if (item.pubDate) {
        pubDate = new Date(item.pubDate).getTime();
      }
      if (isNaN(pubDate)) {
        pubDate = Date.now();
      }

      // Format snippet & retain full rich HTML if provided by feed
      const rawHtml = item['content:encoded'] || item.rawContent || item.content || item.rawDescription || '';
      const rawText = item.contentSnippet || item.summary || rawHtml || item.description || '';
      const snippet = stripHtml(rawText).slice(0, 280);
      const contentHtml = rawHtml && rawHtml.length > 250 ? rawHtml : undefined;

      return {
        id,
        sourceTitle: feedTitle,
        title: item.title?.trim() || 'Untitled Article',
        link,
        pubDate,
        author: item.creator || (item as any).author || undefined,
        snippet,
        contentHtml,
        thumbnail: thumbnail || undefined,
        faviconUrl
      };
    });

    return res.status(200).json({
      ok: true,
      feed: {
        title: feedTitle,
        siteUrl,
        faviconUrl,
        description: parsedFeed.description || '',
        items
      }
    });
  } catch (error: any) {
    console.error(`Error parsing feed URL: ${rawUrl}`, error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to fetch or parse RSS feed'
    });
  }
}
