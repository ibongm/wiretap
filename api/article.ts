import * as cheerio from 'cheerio';

function sanitizeWithCheerio($: cheerio.CheerioAPI, rootEl: any, baseUrl?: string): string {
  // Remove all dangerous or extraneous elements
  $('script, style, noscript, iframe, frame, object, embed, form, input, button, select, textarea, nav, footer, header, aside, svg, .ad, .advertisement, .social-share, .comments, .related-posts', rootEl).remove();

  // Strip all event handlers, inline styles, and dangerous attributes
  $('*', rootEl).each((_, el: any) => {
    if (el.attribs) {
      const attrs = Object.keys(el.attribs);
      for (const attr of attrs) {
        if (
          attr.startsWith('on') ||
          attr.startsWith('data-') ||
          attr === 'style' ||
          attr === 'class' ||
          attr === 'id'
        ) {
          $(el).removeAttr(attr);
        }
      }
    }

    // Harden and resolve external links
    if (el.tagName === 'a') {
      const href = $(el).attr('href') || '';
      if (href.toLowerCase().startsWith('javascript:')) {
        $(el).removeAttr('href');
      } else {
        if (href && baseUrl) {
          try {
            $(el).attr('href', new URL(href, baseUrl).href);
          } catch {
            // keep href
          }
        }
        $(el).attr('target', '_blank');
        $(el).attr('rel', 'noopener noreferrer');
      }
    }

    // Lazy load and resolve relative images
    if (el.tagName === 'img') {
      const src = $(el).attr('src') || '';
      if (src && baseUrl) {
        try {
          $(el).attr('src', new URL(src, baseUrl).href);
        } catch {
          // keep src
        }
      }
      $(el).attr('loading', 'lazy');
    }
  });

  return $(rootEl).html() || '';
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

function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract URL from GET query (?url=...) or POST body ({ url: ... })
  let targetUrl = (req.query?.url as string) || '';
  if (!targetUrl && req.body) {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }
    targetUrl = body?.url || '';
  }

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(200).json({ ok: false, error: 'Missing required "url" parameter' });
  }

  try {
    let cleanUrl = targetUrl.trim();
    if (/^https?%3A/i.test(cleanUrl)) {
      try {
        cleanUrl = decodeURIComponent(cleanUrl);
      } catch {
        // keep cleanUrl
      }
    }

    if (!isSafeUrl(cleanUrl)) {
      return res.status(200).json({ ok: false, error: 'Invalid or forbidden article URL.' });
    }

    // Fetch article HTML with 7-second abort signal
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Wiretap/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        error: `Publisher returned status HTTP ${response.status}`
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Extract Metadata
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

    const rawLead =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('article img, main img').first().attr('src') ||
      null;

    let leadImage: string | null = null;
    if (rawLead) {
      try {
        leadImage = new URL(rawLead, cleanUrl).href;
      } catch {
        leadImage = rawLead;
      }
    }

    let publishedAt = Date.now();
    const pubTimeStr =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime');
    if (pubTimeStr) {
      const parsed = new Date(pubTimeStr).getTime();
      if (!isNaN(parsed)) publishedAt = parsed;
    }

    // 2. Identify candidate article body
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

    let chosenEl: any = null;
    for (const selector of candidates) {
      const el = $(selector);
      if (el.length > 0 && el.text().trim().length > 150) {
        chosenEl = el.first();
        break;
      }
    }

    let cleanContent = '';
    if (chosenEl) {
      // Deduplicate lead image if chosenEl contains the hero image as its first photo
      if (leadImage) {
        const firstImg = $('img', chosenEl).first();
        if (firstImg.length > 0) {
          const imgSrc = firstImg.attr('src') || '';
          const cleanSrc = imgSrc.split('?')[0].replace(/^https?:/, '');
          const cleanLead = leadImage.split('?')[0].replace(/^https?:/, '');

          const isMatch =
            imgSrc === leadImage ||
            cleanSrc === cleanLead ||
            (cleanSrc.length > 15 && cleanLead.includes(cleanSrc)) ||
            (cleanLead.length > 15 && cleanSrc.includes(cleanLead));

          if (isMatch) {
            const parentFig = firstImg.closest('figure');
            if (parentFig.length > 0) {
              parentFig.remove();
            } else {
              firstImg.remove();
            }
          }
        }
      }
      cleanContent = sanitizeWithCheerio($, chosenEl, cleanUrl);
    } else {
      // Collect substantive paragraphs
      const pWrapper = $('<div></div>');
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 35) {
          pWrapper.append($(el).clone());
        }
      });
      cleanContent = sanitizeWithCheerio($, pWrapper, cleanUrl);
    }

    if (!cleanContent.trim()) {
      return res.status(200).json({
        ok: false,
        error: 'Publisher site structure could not be parsed for full text extraction.'
      });
    }

    const textOnly = $(cleanContent).text();
    const readingTimeMinutes = calculateReadingTime(textOnly);

    return res.status(200).json({
      ok: true,
      article: {
        title,
        author,
        content: cleanContent,
        leadImageUrl: leadImage,
        publishedAt,
        readingTimeMinutes,
        url: cleanUrl
      }
    });
  } catch (err: any) {
    console.error(`Extraction error for ${targetUrl}:`, err);
    return res.status(200).json({
      ok: false,
      error: err.message || 'An error occurred while extracting the article'
    });
  }
}
