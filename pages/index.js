export default function Home() {
  return (
    <main style={{fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial', padding: 24, lineHeight: 1.5}}>
      <h1>Sixth Field – API Starter</h1>
      <p>This deployment uses a single catch‑all Serverless Function for API routes.</p>
      <h2>Try the RSS endpoint</h2>
      <p>
        <a href="/api/posts/rss?lookbackHours=720&maxPerFeed=3" target="_blank" rel="noreferrer">
          /api/posts/rss?lookbackHours=720&maxPerFeed=3
        </a>
      </p>
      <p>Edit <code>data/players.json</code> to add or remove feeds.</p>
    </main>
  );
}
