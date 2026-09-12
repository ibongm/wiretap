import * as cheerio from 'cheerio';

interface ExportFeed {
  title: string;
  feedUrl: string;
  siteUrl?: string;
  category?: string;
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

  const { action, feeds, opmlContent } = req.body || {};

  // 1. OPML Export
  if (action === 'export') {
    if (!Array.isArray(feeds)) {
      return res.status(400).json({ ok: false, error: 'Missing or invalid "feeds" array' });
    }

    const grouped: Record<string, ExportFeed[]> = {};
    for (const f of feeds) {
      const cat = f.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(f);
    }

    const dateStr = new Date().toUTCString();

    let outlinesXml = '';
    for (const [category, catFeeds] of Object.entries(grouped)) {
      outlinesXml += `    <outline text="${escapeXml(category)}" title="${escapeXml(category)}">\n`;
      for (const feed of catFeeds) {
        outlinesXml += `      <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.feedUrl)}" htmlUrl="${escapeXml(feed.siteUrl || '')}" />\n`;
      }
      outlinesXml += `    </outline>\n`;
    }

    const opmlXml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Wiretap Feed Subscriptions Export</title>
    <dateCreated>${dateStr}</dateCreated>
    <docs>http://opml.org/spec2.opml</docs>
  </head>
  <body>
${outlinesXml}  </body>
</opml>`;

    return res.status(200).json({
      ok: true,
      opml: opmlXml
    });
  }

  // 2. OPML Import
  if (action === 'import') {
    if (!opmlContent || typeof opmlContent !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing "opmlContent" string' });
    }

    try {
      const $ = cheerio.load(opmlContent, { xmlMode: true });
      const importedFeeds: Array<{
        title: string;
        feedUrl: string;
        siteUrl: string;
        category: string;
      }> = [];

      $('outline[xmlUrl]').each((_, el) => {
        const $el = $(el);
        const xmlUrl = $el.attr('xmlUrl') || '';
        const title = $el.attr('title') || $el.attr('text') || 'Untitled Feed';
        const htmlUrl = $el.attr('htmlUrl') || '';

        // Check parent outline for category
        const parentOutline = $el.parent('outline');
        let category = parentOutline.attr('text') || parentOutline.attr('title') || 'Imported';
        if ($el.attr('category')) {
          category = $el.attr('category')!;
        }

        if (xmlUrl) {
          importedFeeds.push({
            title: title.trim(),
            feedUrl: xmlUrl.trim(),
            siteUrl: htmlUrl.trim(),
            category: category.trim()
          });
        }
      });

      return res.status(200).json({
        ok: true,
        count: importedFeeds.length,
        feeds: importedFeeds
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: 'Failed to parse OPML XML content: ' + err.message });
    }
  }

  return res.status(400).json({ ok: false, error: 'Invalid action. Supported actions: "export", "import"' });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
