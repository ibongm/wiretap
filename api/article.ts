import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both GET ?url=... and POST { url: ... }
  let targetUrl = '';
  if (req.method === 'GET') {
    targetUrl = (req.query?.url as string) || '';
  } else {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }
    targetUrl = body?.url || (req.query?.url as string) || '';
  }

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(200).json({ ok: false, error: 'Missing required "url" parameter' });
  }

  try {
    const cleanTargetUrl = decodeURIComponent(targetUrl.trim());

    // Fetch with 6-second timeout to safely stay under Vercel lambda limits
    const response = await fetch(cleanTargetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Wiretap/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        error: `Publisher returned HTTP ${response.status}`
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Metadata extraction
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      'Untitled Article';

    const author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('meta[name="twitter:creator"]').attr('content') ||
      $('[rel="author"]').first().text().trim() ||
      $('.author, .byline, .author-name').first().text().trim() ||
      null;

    const leadImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('article img, main img').first().attr('src') ||
      null;

    let publishedAt = Date.now();
    const pubTimeStr =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime');
    if (pubTimeStr) {
      const parsed = new Date(pubTimeStr).getTime();
      if (!isNaN(parsed)) publishedAt = parsed;
    }

    // 2. Remove layout junk, advertisements, and scripts
    $('script, style, noscript, iframe, nav, footer, header, form, aside, .advertisement, .ad, .social-share, .comments, .related-posts').remove();

    // 3. Candidate article container search
    const candidates = [
      'article',
      'main',
      '[itemprop="articleBody"]',
      '.article-body',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.story-body',
      '.content__article-body',
      '#article-body'
    ];

    let bodyHtml = '';
    for (const selector of candidates) {
      const el = $(selector);
      if (el.length > 0 && el.text().trim().length > 150) {
        bodyHtml = el.html() || '';
        break;
      }
    }

    // Fallback to substantial paragraphs if no container matched
    if (!bodyHtml) {
      const paragraphs: string[] = [];
      $('p').each((_, el) => {
        const pText = $(el).text().trim();
        if (pText.length > 35) {
          paragraphs.push($(el).prop('outerHTML') || '');
        }
      });
      bodyHtml = paragraphs.join('\n');
    }

    if (!bodyHtml.trim()) {
      return res.status(200).json({
        ok: false,
        error: 'Publisher site structure could not be parsed for full text extraction.'
      });
    }

    // 4. Sanitize HTML strictly preserving typography while stripping trackers & scripts
    const cleanHtml = sanitizeHtml(bodyHtml, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 'code', 'pre',
        'hr', 'br', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'img', 'picture', 'source', 'time', 'span'
      ],
      allowedAttributes: {
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        source: ['srcset', 'media', 'type'],
        blockquote: ['cite'],
        time: ['datetime']
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
      }
    });

    // 5. Reading time estimation (200 wpm)
    const textOnly = sanitizeHtml(cleanHtml, { allowedTags: [] });
    const words = textOnly.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

    return res.status(200).json({
      ok: true,
      article: {
        title,
        author,
        content: cleanHtml,
        leadImageUrl: leadImage,
        publishedAt,
        readingTimeMinutes,
        url: cleanTargetUrl
      }
    });
  } catch (err: any) {
    console.error(`Error in /api/article for ${targetUrl}:`, err);
    return res.status(200).json({
      ok: false,
      error: err.message || 'An error occurred while extracting the article'
    });
  }
}
