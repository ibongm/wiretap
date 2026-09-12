import * as cheerio from 'cheerio';

interface DiscoveredFeed {
  title: string;
  url: string;
  type: string;
  faviconUrl?: string;
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing required field "url" in request body' });
  }

  try {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    if (!isSafeUrl(targetUrl)) {
      return res.status(400).json({ ok: false, error: 'Invalid or forbidden discovery URL.' });
    }

    const parsed = new URL(targetUrl);
    const discovered: DiscoveredFeed[] = [];

    // 1. Reddit Subreddit Detection
    const redditMatch = targetUrl.match(/reddit\.com\/r\/([^/?#]+)/i);
    if (redditMatch) {
      const subreddit = redditMatch[1];
      discovered.push({
        title: `Reddit r/${subreddit}`,
        url: `https://www.reddit.com/r/${subreddit}/.rss`,
        type: 'application/rss+xml',
        faviconUrl: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png'
      });
      return res.status(200).json({ ok: true, feeds: discovered });
    }

    // 2. YouTube Detection
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      // Direct channel ID
      const channelIdMatch = targetUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i);
      if (channelIdMatch) {
        discovered.push({
          title: 'YouTube Channel',
          url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`,
          type: 'application/rss+xml',
          faviconUrl: 'https://www.youtube.com/s/desktop/favicon.ico'
        });
        return res.status(200).json({ ok: true, feeds: discovered });
      }

      // Handle /@username or /c/name by fetching the YouTube page to find channel_id or externalId
      try {
        const ytRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          }
        });
        const ytHtml = await ytRes.text();
        const $yt = cheerio.load(ytHtml);

        let channelId = $yt('meta[itemprop="channelId"]').attr('content') ||
                        $yt('meta[itemprop="identifier"]').attr('content');

        if (!channelId) {
          const match = ytHtml.match(/channel_id=([a-zA-Z0-9_-]+)/) ||
                        ytHtml.match(/"channelId":"([a-zA-Z0-9_-]+)"/) ||
                        ytHtml.match(/"externalId":"([a-zA-Z0-9_-]+)"/);
          if (match) channelId = match[1];
        }

        const ytTitle = $yt('title').text().replace(' - YouTube', '').trim() || 'YouTube Channel';

        if (channelId) {
          discovered.push({
            title: ytTitle,
            url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
            type: 'application/rss+xml',
            faviconUrl: 'https://www.youtube.com/s/desktop/favicon.ico'
          });
          return res.status(200).json({ ok: true, feeds: discovered });
        }
      } catch (e) {
        console.warn('YouTube channel ID resolution failed, falling through to generic HTML check', e);
      }
    }

    // 3. Direct Feed Check: Is the URL itself already an RSS/XML feed?
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Wiretap/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,application/atom+xml,*/*;q=0.8'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (
      contentType.includes('xml') ||
      contentType.includes('rss') ||
      contentType.includes('atom') ||
      text.trim().startsWith('<?xml') ||
      text.trim().startsWith('<rss') ||
      text.trim().startsWith('<feed')
    ) {
      discovered.push({
        title: parsed.hostname,
        url: targetUrl,
        type: contentType || 'application/rss+xml',
        faviconUrl: `${parsed.origin}/favicon.ico`
      });
      return res.status(200).json({ ok: true, feeds: discovered });
    }

    // 4. HTML Auto-Discovery: Scrape <link rel="alternate"> tags
    const $ = cheerio.load(text);
    const siteTitle = $('title').text().trim() || parsed.hostname;
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
    let faviconUrl = `${parsed.origin}/favicon.ico`;
    if (favicon) {
      try {
        faviconUrl = new URL(favicon, targetUrl).href;
      } catch {
        faviconUrl = `${parsed.origin}/favicon.ico`;
      }
    }

    $('link[rel="alternate"]').each((_, elem) => {
      const type = $(elem).attr('type') || '';
      const href = $(elem).attr('href') || '';
      const title = $(elem).attr('title') || siteTitle;

      if (
        type.includes('rss') ||
        type.includes('atom') ||
        type.includes('xml') ||
        type.includes('json')
      ) {
        if (href) {
          try {
            const feedUrl = new URL(href, targetUrl).href;
            if (isSafeUrl(feedUrl) && !discovered.some(f => f.url === feedUrl)) {
              discovered.push({
                title,
                url: feedUrl,
                type,
                faviconUrl
              });
            }
          } catch {
            // invalid url
          }
        }
      }
    });

    // 5. Fallback Guessing if nothing found
    if (discovered.length === 0) {
      const commonPaths = ['/feed', '/rss', '/rss.xml', '/atom.xml', '/feed.xml'];
      for (const path of commonPaths) {
        const candidateUrl = `${parsed.origin}${path}`;
        try {
          const probe = await fetch(candidateUrl, { method: 'HEAD', headers: { 'User-Agent': 'Wiretap/1.0' } });
          const ct = probe.headers.get('content-type') || '';
          if (probe.ok && (ct.includes('xml') || ct.includes('rss') || ct.includes('atom'))) {
            discovered.push({
              title: `${siteTitle} (${path})`,
              url: candidateUrl,
              type: ct,
              faviconUrl
            });
            break;
          }
        } catch {
          // ignore probe error
        }
      }
    }

    return res.status(200).json({ ok: true, feeds: discovered });
  } catch (err: any) {
    console.error(`Error in /api/discover for ${url}:`, err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to discover feeds' });
  }
}
