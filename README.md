# Sixth Field — Catch‑all API with RSS

This minimal Next.js project collapses **all API routes into one Serverless Function** using a catch‑all route at `pages/api/[[...slug]].js`. It includes a hardened RSS fetcher and a curated list of working feeds in `data/players.json`.

## Endpoint
- `GET /api/posts/rss` (also works with POST)
  - Params:
    - `lookbackHours` (default 720)
    - `maxPerFeed` (default 4)
    - `tiers` (array, defaults to ["major","mid","light"])

Example:
```
/api/posts/rss?lookbackHours=720&maxPerFeed=3
```

## Local dev (optional)
```bash
npm install
npm run dev
```
Open http://localhost:3000 and try the RSS endpoint above.

## Deploy (Vercel)
1. Push this folder to a new GitHub repo.
2. Import the repo in Vercel. Vercel will run `npm install` and build automatically.
3. Visit `/api/posts/rss` on your deployed URL.

## Feeds
Edit `data/players.json` to add/remove sources. Keep `type: "rss"` for each feed.

Generated on 2025-08-22.
