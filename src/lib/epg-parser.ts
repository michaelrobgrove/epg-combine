// Uses the built-in DOMParser available in Cloudflare Workers (Web Standard API).
// Do NOT import @xmldom/xmldom — it is not needed in the CF Workers runtime.

export interface Channel {
  id: string;
  displayName: string;
  icon?: string;
  url?: string;
}

export interface Program {
  channel: string;
  start: Date;
  stop: Date;
  title: string;
  desc?: string;
  category?: string[];
  episodeNum?: string;
}

export interface EPGData {
  channels: Channel[];
  programs: Program[];
  source: string;
  lastUpdated: Date;
}

/** Parse XMLTV time format: YYYYMMDDHHMMSS +0000 */
function parseEPGTime(timeStr: string): Date {
  if (!timeStr) return new Date(0);
  // Remove timezone offset
  const clean = timeStr.replace(/\s[+-]\d{4}$/, '').trim();
  if (clean.length < 14) return new Date(0);
  const year   = parseInt(clean.substring(0, 4), 10);
  const month  = parseInt(clean.substring(4, 6), 10) - 1;
  const day    = parseInt(clean.substring(6, 8), 10);
  const hour   = parseInt(clean.substring(8, 10), 10);
  const minute = parseInt(clean.substring(10, 12), 10);
  const second = parseInt(clean.substring(12, 14), 10);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function parseChannels(doc: Document): Channel[] {
  const channels: Channel[] = [];
  const elements = doc.getElementsByTagName('channel');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const id = el.getAttribute('id');
    if (!id) continue;
    const displayName =
      el.getElementsByTagName('display-name')[0]?.textContent?.trim() ?? id;
    const icon =
      el.getElementsByTagName('icon')[0]?.getAttribute('src') ?? undefined;
    const url =
      el.getElementsByTagName('url')[0]?.textContent?.trim() ?? undefined;
    channels.push({ id, displayName, icon, url });
  }
  return channels;
}

function parsePrograms(doc: Document): Program[] {
  const programs: Program[] = [];
  const elements = doc.getElementsByTagName('programme');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const channel = el.getAttribute('channel');
    if (!channel) continue;
    const start = parseEPGTime(el.getAttribute('start') ?? '');
    const stop  = parseEPGTime(el.getAttribute('stop') ?? '');
    const title =
      el.getElementsByTagName('title')[0]?.textContent?.trim() ?? '';
    const desc =
      el.getElementsByTagName('desc')[0]?.textContent?.trim() ?? undefined;
    const categoryEls = el.getElementsByTagName('category');
    const category: string[] = [];
    for (let j = 0; j < categoryEls.length; j++) {
      const c = categoryEls[j].textContent?.trim();
      if (c) category.push(c);
    }
    const episodeNum =
      el.getElementsByTagName('episode-num')[0]?.textContent?.trim() ?? undefined;
    programs.push({ channel, start, stop, title, desc, category, episodeNum });
  }
  return programs;
}

async function decompressGzip(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  // DecompressionStream is available in CF Workers
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();

  writer.write(buffer);
  writer.close();

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder('utf-8').decode(merged);
}

export class EPGParser {
  async parseEPG(url: string): Promise<EPGData> {
    // Fetch without Accept-Encoding so CF doesn't auto-decompress
    // (we handle .gz manually so we know what we got)
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const isGzip =
      url.toLowerCase().endsWith('.gz') ||
      contentType.includes('gzip') ||
      contentType.includes('x-gzip');

    let text: string;
    if (isGzip) {
      text = await decompressGzip(response);
    } else {
      text = await response.text();
    }

    if (!text.trim().startsWith('<')) {
      throw new Error(`Response from ${url} does not appear to be XML`);
    }

    // Use the globally available DOMParser in CF Workers
    const doc = new DOMParser().parseFromString(text, 'text/xml');

    const channels = parseChannels(doc);
    const programs = parsePrograms(doc);

    if (channels.length === 0 && programs.length === 0) {
      // Check for parse errors in the document
      const parseError = doc.getElementsByTagName('parsererror')[0];
      if (parseError) {
        throw new Error(`XML parse error in ${url}: ${parseError.textContent?.slice(0, 200)}`);
      }
    }

    return {
      channels,
      programs,
      source: url,
      lastUpdated: new Date(),
    };
  }
}

export const epgParser = new EPGParser();
