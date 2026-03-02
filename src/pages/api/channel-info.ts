import { authManager } from '../../lib/auth';

// Mock program data - in a real implementation, this would come from D1 database
interface MockProgram {
  channel: string;
  start: Date;
  stop: Date;
  title: string;
  desc?: string;
  category?: string[];
  episodeNum?: string;
}

const mockPrograms: MockProgram[] = [
  {
    channel: 'aande.us',
    start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    stop: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    title: 'Storage Wars',
    desc: 'Auctioning storage units',
    category: ['Reality'],
    episodeNum: 'S12E05'
  },
  {
    channel: 'aande.us',
    start: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    stop: new Date(Date.now() + 90 * 60 * 1000), // 90 minutes from now
    title: 'Duck Dynasty',
    desc: 'The Robertson family',
    category: ['Reality'],
    episodeNum: 'S11E12'
  },
  {
    channel: 'nbc.us',
    start: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    stop: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    title: 'The Tonight Show',
    desc: 'Late night talk show',
    category: ['Talk Show'],
    episodeNum: 'S70E145'
  },
  {
    channel: 'cbs.us',
    start: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    stop: new Date(Date.now() + 120 * 60 * 1000), // 2 hours from now
    title: 'NCIS',
    desc: 'Naval Criminal Investigative Service',
    category: ['Drama'],
    episodeNum: 'S21E18'
  }
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
  const channelId = searchParams.get('id');
  
  if (!channelId) {
    return new Response(
      JSON.stringify({ error: 'Channel ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Find current program
  const now = new Date();
  const currentProgram = mockPrograms.find(p => 
    p.channel === channelId && 
    p.start <= now && 
    p.stop > now
  );

  // Find next hour programs
  const nextHourStart = now;
  const nextHourEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const nextHourPrograms = mockPrograms
    .filter(p => 
      p.channel === channelId && 
      p.start >= nextHourStart && 
      p.start < nextHourEnd
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find channel info
  const channelInfo = {
    id: channelId,
    displayName: getChannelDisplayName(channelId),
    icon: getChannelIcon(channelId),
    url: getChannelUrl(channelId)
  };

  return new Response(
    JSON.stringify({
      channel: channelInfo,
      currentProgram,
      nextHourPrograms,
      nextHourCount: nextHourPrograms.length
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

function getChannelDisplayName(id: string): string {
  const channelMap: { [key: string]: string } = {
    'aande.us': 'A&E',
    'a&enetwork.us': 'A&E Network',
    'nbc.us': 'NBC',
    'cbs.us': 'CBS',
    'abc.us': 'ABC',
    'fox.us': 'FOX',
    'hbo.us': 'HBO',
    'discovery.us': 'Discovery Channel',
    'history.us': 'History Channel',
    'espn.us': 'ESPN'
  };
  return channelMap[id] || id;
}

function getChannelIcon(id: string): string | undefined {
  const iconMap: { [key: string]: string } = {
    'aande.us': 'https://example.com/aande.png',
    'a&enetwork.us': 'https://example.com/aenetwork.png',
    'nbc.us': 'https://example.com/nbc.png',
    'cbs.us': 'https://example.com/cbs.png',
    'abc.us': 'https://example.com/abc.png',
    'fox.us': 'https://example.com/fox.png',
    'hbo.us': 'https://example.com/hbo.png',
    'discovery.us': 'https://example.com/discovery.png',
    'history.us': 'https://example.com/history.png',
    'espn.us': 'https://example.com/espn.png'
  };
  return iconMap[id];
}

function getChannelUrl(id: string): string | undefined {
  const urlMap: { [key: string]: string } = {
    'aande.us': 'https://www.aetv.com',
    'a&enetwork.us': 'https://www.aenetworks.com',
    'nbc.us': 'https://www.nbc.com',
    'cbs.us': 'https://www.cbs.com',
    'abc.us': 'https://abc.com',
    'fox.us': 'https://www.fox.com',
    'hbo.us': 'https://www.hbo.com',
    'discovery.us': 'https://www.discovery.com',
    'history.us': 'https://www.history.com',
    'espn.us': 'https://www.espn.com'
  };
  return urlMap[id];
}