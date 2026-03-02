interface MockChannel {
  id: string;
  displayName: string;
  icon?: string;
}

const mockChannels: MockChannel[] = [
  { id: 'aande.us', displayName: 'A&E', icon: 'https://example.com/aande.png' },
  { id: 'a&enetwork.us', displayName: 'A&E Network', icon: 'https://example.com/aenetwork.png' },
  { id: 'nbc.us', displayName: 'NBC', icon: 'https://example.com/nbc.png' },
  { id: 'cbs.us', displayName: 'CBS', icon: 'https://example.com/cbs.png' },
  { id: 'abc.us', displayName: 'ABC', icon: 'https://example.com/abc.png' },
  { id: 'fox.us', displayName: 'FOX', icon: 'https://example.com/fox.png' },
  { id: 'hbo.us', displayName: 'HBO', icon: 'https://example.com/hbo.png' },
  { id: 'discovery.us', displayName: 'Discovery Channel', icon: 'https://example.com/discovery.png' },
  { id: 'history.us', displayName: 'History Channel', icon: 'https://example.com/history.png' },
  { id: 'espn.us', displayName: 'ESPN', icon: 'https://example.com/espn.png' },
];

export async function GET({ url }: { url: URL }) {
  const query = new URL(url.toString()).searchParams.get('q') || '';

  if (!query) {
    return new Response(JSON.stringify({ error: 'Search query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = mockChannels.filter(
    ch =>
      ch.id.toLowerCase().includes(query.toLowerCase()) ||
      ch.displayName.toLowerCase().includes(query.toLowerCase())
  );

  return new Response(
    JSON.stringify({ results: results.slice(0, 20), total: results.length, query }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
