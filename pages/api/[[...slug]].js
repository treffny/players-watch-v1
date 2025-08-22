// pages/api/[[...slug]].js
import Parser from 'rss-parser';
import players from '../../data/players.json';

// ===== utilities =====
const parser = new Parser({ timeout: 10000 });

function parseDateSafe(d) {
  const t = Date.parse(d);
  return Number.isNaN(t) ? Date.now() : t;
}

async function fetchRssFeed(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    const looksXml =
      contentType.includes('xml') ||
      contentType.includes('rss') ||
      text.trim().startsWith('<');
    if (!looksXml) throw new Error(`Non-XML content from ${url}`);

    const feed = await parser.parseString(text);
    const items = (feed.items || []).map((it) => ({
      title: it.title || '(no title)',
      link: it.link || it.guid || '',
      createdAt: it.isoDate || it.pubDate || new Date().toISOString(),
      sourceTitle: feed.title || url,
    }));
    return { ok: true, items, meta: { title: feed.title || url } };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ===== route handlers =====
async function handleRss(req, res) {
  try {
    const body = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const lookbackHours = Number(body.lookbackHours ?? 720);
    const maxPerFeed = Number(body.maxPerFeed ?? 4);
    const tiers = Array.isArray(body.tiers) ? body.tiers : ['major', 'mid', 'light'];
    const cutoffMs = Date.now() - lookbackHours * 3600 * 1000;

    const urls = [];
    for (const p of players) {
      if (!tiers.includes(p.tier)) continue;
      for (const f of p.feeds || []) {
        if (f?.type === 'rss' && f?.url) urls.push({ url: f.url, sourceName: p.name });
      }
    }

    const results = await Promise.all(urls.map((u) => fetchRssFeed(u.url)));

    const errors = [];
    const allItems = [];

    results.forEach((r, i) => {
      const srcName = urls[i].sourceName;
      const srcUrl = urls[i].url;

      if (!r.ok) {
        errors.push({ source: srcName, url: srcUrl, error: r.error });
        return;
      }

      const picked = r.items
        .filter((it) => parseDateSafe(it.createdAt) >= cutoffMs)
        .slice(0, maxPerFeed)
        .map((it) => ({
          title: it.title,
          link: it.link,
          createdAt: it.createdAt,
          source: srcName,
        }));

      allItems.push(...picked);
    });

    // De-dupe by link (or title)
    const seen = new Set();
    const deduped = [];
    for (const it of allItems) {
      const key = it.link || `t:${it.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(it);
    }

    // Sort newest first and cap
    deduped.sort((a, b) => parseDateSafe(b.createdAt) - parseDateSafe(a.createdAt));
    const capped = deduped.slice(0, 120);

    return res.status(200).json({
      count: capped.length,
      items: capped,
      debug: { feedsInEnv: urls.length, errors }
    });
  } catch (e) {
    return res.status(200).json({ count: 0, items: [], debug: { error: String(e?.message || e) } });
  }
}

// ===== router =====
export default async function handler(req, res) {
  try {
    // normalise path like "posts/rss"
    const slug = (req.query.slug ?? [])
      .filter(Boolean)
      .join('/')
      .toLowerCase();

    if (slug === 'posts/rss' || slug === 'rss') {
      return handleRss(req, res);
    }

    // Fallback 404 (still JSON)
    return res.status(200).json({
      count: 0,
      items: [],
      debug: { error: `Unknown endpoint "${slug}".` }
    });
  } catch (e) {
    return res.status(200).json({ count: 0, items: [], debug: { error: String(e?.message || e) } });
  }
}
