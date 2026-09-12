import { extract } from '@extractus/article-extractor';
import sanitizeHtml from 'sanitize-html';
import * as cheerio from 'cheerio';

function cleanHtmlContent(rawHtml: string): string {
  return sanitizeHtml(rawHtml, {
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
}

function calculateReadingTime(cleanHtml: string): number {
  const textOnly = sanitizeHtml(cleanHtml, { allowedTags: [] });
  const words = textOnly.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Fallback HTML extractor using Cheerio if article-extractor fails
async function fallbackExtract(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Wiretap/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    signal: AbortSignal.timeout(5000)
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, forms, navigations
  $('script, style, noscript, iframe, nav, footer, header, form, aside').remove();

  const title = $('meta[property="og:title"]').attr('content') ||
                $('title').text().trim() || 'Untitled Article';

  const author = $('meta[name="author"]').attr('content') ||
                 $('meta[property="article:author"]').attr('content') || null;

  const leadImage = $('meta[property="og:image"]').attr('content') || null;

  // Find candidate article element
  let bodyHtml = '';
  const articleEl = $('article, main, .post-content, .article-content, .entry-content');
  if (articleEl.length > 0) {
    bodyHtml = articleEl.first().html() || '';
  } else {
    // Collect all substantial paragraphs
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) {
        paragraphs.push($(el).prop('outerHTML') || '');
      }
    });
    bodyHtml = paragraphs.join('\n');
  }

  if (!bodyHtml.trim()) {
    return null;
  }

  const clean = cleanHtmlContent(bodyHtml);
  return {
    title,
    author,
    content: clean,
    leadImageUrl: leadImage,
    publishedAt: Date.now(),
    readingTimeMinutes: calculateReadingTime(clean),
    url
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: false, error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // ignore
    }
  }

  const { url } = body || {};
  if (!url || typeof url !== 'string') {
    return res.status(200).json({ ok: false, error: 'Missing required field "url" in request body' });
  }

  try {
    // Race extraction against a 6.5-second timeout to avoid Vercel 10s lambda cutoff
    const extractPromise = extract(
      url,
      {},
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Wiretap/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Extraction timed out')), 6500)
    );

    let articleData: any = null;
    try {
      articleData = await Promise.race([extractPromise, timeoutPromise]);
    } catch (extractErr) {
      console.warn(`Primary extractor failed for ${url}, trying fallback:`, extractErr);
    }

    if (articleData && articleData.content) {
      const cleanHtml = cleanHtmlContent(articleData.content);
      const readingTimeMinutes = calculateReadingTime(cleanHtml);

      let publishedAt = Date.now();
      if (articleData.published) {
        const parsedTime = new Date(articleData.published).getTime();
        if (!isNaN(parsedTime)) publishedAt = parsedTime;
      }

      return res.status(200).json({
        ok: true,
        article: {
          title: articleData.title || 'Untitled Article',
          author: articleData.author || null,
          content: cleanHtml,
          leadImageUrl: articleData.image || null,
          publishedAt,
          readingTimeMinutes,
          sourceTitle: articleData.source || undefined,
          url
        }
      });
    }

    // Try fallback Cheerio extraction
    const fallback = await fallbackExtract(url).catch(() => null);
    if (fallback && fallback.content) {
      return res.status(200).json({
        ok: true,
        article: fallback
      });
    }

    return res.status(200).json({
      ok: false,
      error: 'Publisher site structure could not be parsed for full text extraction.'
    });
  } catch (err: any) {
    console.error(`Error in /api/article for ${url}:`, err);
    return res.status(200).json({
      ok: false,
      error: err.message || 'An error occurred while extracting the article'
    });
  }
}
