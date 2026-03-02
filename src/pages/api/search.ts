import { getCache } from '../../lib/epg-cache';

export async function GET({ url }: { url: URL }) {
  const query = new URL(url.toString()).searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return new Response(JSON.stringify({ error: 'Search query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cache = getCache();
  const channels = cache?.channels ?? [];

  const q = query.toLowerCase();
  const results = channels.filter(
    ch =>
      ch.id.toLowerCase().includes(q) ||
      ch.displayName.toLowerCase().includes(q)
  );

  return new Response(
    JSON.stringify({ results: results.slice(0, 50), total: results.length, query }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
