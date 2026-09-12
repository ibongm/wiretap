import { extract } from '@extractus/article-extractor';
import sanitizeHtml from 'sanitize-html';

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
    const articleData = await extract(
      url,
      {},
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Wiretap/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }
    );

    if (!articleData) {
      return res.status(404).json({ ok: false, error: 'Failed to extract article content from URL' });
    }

    const rawHtml = articleData.content || '';

    // Sanitize HTML strictly preserving typography while stripping trackers & scripts
    const cleanHtml = sanitizeHtml(rawHtml, {
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

    // Word count & reading time calculation (avg 200 wpm)
    const textOnly = sanitizeHtml(cleanHtml, { allowedTags: [] });
    const words = textOnly.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

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
  } catch (err: any) {
    console.error(`Error extracting article for ${url}:`, err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'An error occurred while extracting the article'
    });
  }
}
