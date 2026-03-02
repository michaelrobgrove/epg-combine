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
    start: new Date(Date.now() - 60 * 60 * 1000),
    stop: new Date(Date.now() + 30 * 60 * 1000),
    title: 'Storage Wars',
    desc: 'Auctioning storage units',
    category: ['Reality'],
    episodeNum: 'S12E05',
  },
  {
    channel: 'aande.us',
    start: new Date(Date.now() + 30 * 60 * 1000),
    stop: new Date(Date.now() + 90 * 60 * 1000),
    title: 'Duck Dynasty',
    desc: 'The Robertson family',
    category: ['Reality'],
    episodeNum: 'S11E12',
  },
  {
    channel: 'nbc.us',
    start: new Date(Date.now() - 30 * 60 * 1000),
    stop: new Date(Date.now() + 60 * 60 * 1000),
    title: 'The Tonight Show',
    desc: 'Late night talk show',
    category: ['Talk Show'],
    episodeNum: 'S70E145',
  },
  {
    channel: 'cbs.us',
    start: new Date(Date.now() + 60 * 60 * 1000),
    stop: new Date(Date.now() + 120 * 60 * 1000),
    title: 'NCIS',
    desc: 'Naval Criminal Investigative Service',
    category: ['Drama'],
    episodeNum: 'S21E18',
  },
];

const channelDisplayNames: Record<string, string> = {
  'aande.us': 'A&E',
  'a&enetwork.us': 'A&E Network',
  'nbc.us': 'NBC',
  'cbs.us': 'CBS',
  'abc.us': 'ABC',
  'fox.us': 'FOX',
  'hbo.us': 'HBO',
  'discovery.us': 'Discovery Channel',
  'history.us': 'History Channel',
  'espn.us': 'ESPN',
};

export async function GET({ url }: { url: URL }) {
  const channelId = new URL(url.toString()).searchParams.get('id');

  if (!channelId) {
    return new Response(JSON.stringify({ error: 'Channel ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();
  const currentProgram = mockPrograms.find(
    p => p.channel === channelId && p.start <= now && p.stop > now
  );

  const nextHourEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const nextHourPrograms = mockPrograms
    .filter(p => p.channel === channelId && p.start >= now && p.start < nextHourEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return new Response(
    JSON.stringify({
      channel: { id: channelId, displayName: channelDisplayNames[channelId] ?? channelId },
      currentProgram,
      nextHourPrograms,
      nextHourCount: nextHourPrograms.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
