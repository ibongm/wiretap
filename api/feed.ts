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
}

const parser = new Parser<Record<string, unknown>, CustomFeedItem>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded']
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
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : undefined;
}

function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
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
    const feedUrl = decodeURIComponent(rawUrl);
    const parsedFeed = await parser.parseURL(feedUrl);

    const siteUrl = parsedFeed.link || new URL(feedUrl).origin;
    const feedTitle = parsedFeed.title || 'Untitled Feed';

    const items = (parsedFeed.items || []).map((item) => {
      const link = item.link || item.guid || '';
      const id = hashString(link || item.title || Math.random().toString());

      // Extract thumbnail
      let thumbnail =
        item['media:thumbnail']?.$?.url ||
        item['media:content']?.$?.url;

      if (!thumbnail && item.enclosure?.url && item.enclosure?.type?.startsWith('image')) {
        thumbnail = item.enclosure.url;
      }

      if (!thumbnail) {
        thumbnail = extractImageFromHtml(item['content:encoded'] || item.content || item.contentSnippet);
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

      // Format snippet
      const rawText = item.contentSnippet || item.summary || item['content:encoded'] || item.content || '';
      const snippet = stripHtml(rawText).slice(0, 280);

      return {
        id,
        sourceTitle: feedTitle,
        title: item.title?.trim() || 'Untitled Article',
        link,
        pubDate,
        author: item.creator || (item as any).author || undefined,
        snippet,
        thumbnail: thumbnail || undefined
      };
    });

    return res.status(200).json({
      ok: true,
      feed: {
        title: feedTitle,
        siteUrl,
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
