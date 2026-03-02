import { authManager } from '../../lib/auth';

// Mock channel data - in a real implementation, this would come from D1 database
interface MockChannel {
  id: string;
  displayName: string;
  icon?: string;
  url?: string;
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
  { id: 'espn.us', displayName: 'ESPN', icon: 'https://example.com/espn.png' }
];

export async function GET({ url, cookies }: { url: URL; cookies: any }) {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = authManager.getSession(sessionId);
  
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const searchParams = new URL(url.toString()).searchParams;
  const query = searchParams.get('q') || '';
  
  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Search query is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Simple search implementation
  const results = mockChannels.filter(channel => 
    channel.id.toLowerCase().includes(query.toLowerCase()) ||
    channel.displayName.toLowerCase().includes(query.toLowerCase())
  );

  return new Response(
    JSON.stringify({ 
      results: results.slice(0, 20), // Limit results
      total: results.length,
      query
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}