import { getCache } from '../lib/epg-cache';

function formatEPGTime(date: Date): string {
  const d = new Date(date);
  const year   = d.getUTCFullYear();
  const month  = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day    = String(d.getUTCDate()).padStart(2, '0');
  const hours  = String(d.getUTCHours()).padStart(2, '0');
  const mins   = String(d.getUTCMinutes()).padStart(2, '0');
  const secs   = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${mins}${secs} +0000`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET({ url }: { url: URL }) {
  const format = new URL(url.toString()).searchParams.get('format') ?? 'xml';

  const cache = getCache();

  if (format === 'json') {
    return new Response(
      JSON.stringify(
        cache
          ? { channels: cache.channels, programs: cache.programs, lastUpdated: cache.lastUpdated }
          : { channels: [], programs: [], lastUpdated: null },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  if (!cache || cache.channels.length === 0) {
    const empty = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE tv SYSTEM "xmltv.dtd">\n<tv generator-info-name="EPG Combine"></tv>`;
    return new Response(empty, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const channelsXml = cache.channels
    .map(ch => {
      let xml = `  <channel id="${escapeXml(ch.id)}">\n`;
      xml += `    <display-name>${escapeXml(ch.displayName)}</display-name>\n`;
      if (ch.icon) xml += `    <icon src="${escapeXml(ch.icon)}" />\n`;
      if (ch.url)  xml += `    <url>${escapeXml(ch.url)}</url>\n`;
      xml += `  </channel>`;
      return xml;
    })
    .join('\n');

  const programsXml = cache.programs
    .map(p => {
      let xml = `  <programme channel="${escapeXml(p.channel)}" start="${formatEPGTime(p.start)}" stop="${formatEPGTime(p.stop)}">\n`;
      xml += `    <title>${escapeXml(p.title)}</title>\n`;
      if (p.desc) xml += `    <desc>${escapeXml(p.desc)}</desc>\n`;
      if (p.category) {
        for (const cat of p.category) {
          xml += `    <category>${escapeXml(cat)}</category>\n`;
        }
      }
      if (p.episodeNum) xml += `    <episode-num system="onscreen">${escapeXml(p.episodeNum)}</episode-num>\n`;
      xml += `  </programme>`;
      return xml;
    })
    .join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="EPG Combine" generator-info-url="https://epg-combine.pages.dev">
${channelsXml}
${programsXml}
</tv>`;

  return new Response(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
