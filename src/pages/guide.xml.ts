import { authManager } from '../lib/auth';

// Mock combined EPG data - in a real implementation, this would come from KV/D1 storage
interface MockEPGData {
  channels: Array<{
    id: string;
    displayName: string;
    icon?: string;
    url?: string;
  }>;
  programs: Array<{
    channel: string;
    start: Date;
    stop: Date;
    title: string;
    desc?: string;
    category?: string[];
    episodeNum?: string;
  }>;
}

const mockEPGData: MockEPGData = {
  channels: [
    { id: 'aande.us', displayName: 'A&E', icon: 'https://example.com/aande.png' },
    { id: 'nbc.us', displayName: 'NBC', icon: 'https://example.com/nbc.png' },
    { id: 'cbs.us', displayName: 'CBS', icon: 'https://example.com/cbs.png' },
    { id: 'abc.us', displayName: 'ABC', icon: 'https://example.com/abc.png' },
    { id: 'fox.us', displayName: 'FOX', icon: 'https://example.com/fox.png' }
  ],
  programs: [
    {
      channel: 'aande.us',
      start: new Date(Date.now() - 60 * 60 * 1000),
      stop: new Date(Date.now() + 30 * 60 * 1000),
      title: 'Storage Wars',
      desc: 'Auctioning storage units',
      category: ['Reality'],
      episodeNum: 'S12E05'
    },
    {
      channel: 'aande.us',
      start: new Date(Date.now() + 30 * 60 * 1000),
      stop: new Date(Date.now() + 90 * 60 * 1000),
      title: 'Duck Dynasty',
      desc: 'The Robertson family',
      category: ['Reality'],
      episodeNum: 'S11E12'
    },
    {
      channel: 'nbc.us',
      start: new Date(Date.now() - 30 * 60 * 1000),
      stop: new Date(Date.now() + 60 * 60 * 1000),
      title: 'The Tonight Show',
      desc: 'Late night talk show',
      category: ['Talk Show'],
      episodeNum: 'S70E145'
    },
    {
      channel: 'cbs.us',
      start: new Date(Date.now() + 60 * 60 * 1000),
      stop: new Date(Date.now() + 120 * 60 * 1000),
      title: 'NCIS',
      desc: 'Naval Criminal Investigative Service',
      category: ['Drama'],
      episodeNum: 'S21E18'
    },
    {
      channel: 'abc.us',
      start: new Date(Date.now() + 120 * 60 * 1000),
      stop: new Date(Date.now() + 180 * 60 * 1000),
      title: 'Grey\'s Anatomy',
      desc: 'Medical drama',
      category: ['Drama'],
      episodeNum: 'S20E15'
    }
  ]
};

function formatEPGTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Add timezone offset (assuming UTC for simplicity)
  return `${year}${month}${day}${hours}${minutes}${seconds} +0000`;
}

function generateXML(epgData: MockEPGData): string {
  const channelsXML = epgData.channels.map(channel => `
  <channel id="${channel.id}">
    <display-name>${channel.displayName}</display-name>
    ${channel.icon ? `<icon src="${channel.icon}" />` : ''}
    ${channel.url ? `<url>${channel.url}</url>` : ''}
  </channel>`).join('');

  const programsXML = epgData.programs.map(program => `
  <programme channel="${program.channel}" start="${formatEPGTime(program.start)}" stop="${formatEPGTime(program.stop)}">
    <title>${program.title}</title>
    ${program.desc ? `<desc>${program.desc}</desc>` : ''}
    ${program.category ? program.category.map(cat => `<category>${cat}</category>`).join('') : ''}
    ${program.episodeNum ? `<episode-num system="onscreen">${program.episodeNum}</episode-num>` : ''}
  </programme>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="EPG Manager" generator-info-url="https://example.com">
${channelsXML}
${programsXML}
</tv>`;
}

export async function GET({ url, cookies }: { url: URL; cookies: any }) {
  // This endpoint is public - no authentication required
  // Anyone can access the combined guide.xml
  
  const searchParams = new URL(url.toString()).searchParams;
  const format = searchParams.get('format') || 'xml';
  
  if (format === 'json') {
    return new Response(
      JSON.stringify(mockEPGData, null, 2),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    );
  }

  const xmlContent = generateXML(mockEPGData);
  
  return new Response(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}