import { EPGParser } from '../../lib/epg-parser';
import { PriorityMerger } from '../../lib/priority-merger';
import { setCache } from '../../lib/epg-cache';

export async function POST({ request }: { request: Request }) {
  try {
    const { urls } = await request.json() as { urls: string[] };

    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No URLs provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parser = new EPGParser();
    const merger = new PriorityMerger();
    merger.setSourcePriorities(urls);

    const fetchErrors: string[] = [];
    const epgDataList = [];

    // Fetch and parse all EPG sources (in parallel for speed)
    const results = await Promise.allSettled(urls.map(url => parser.parseEPG(url)));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        epgDataList.push(result.value);
      } else {
        fetchErrors.push(`${urls[i]}: ${result.reason?.message ?? 'unknown error'}`);
      }
    }

    const merged = merger.mergeEPGData(epgDataList);
    const now = Date.now();

    setCache({
      channels: merged.channels,
      programs: merged.programs,
      channelCount: merged.channelCount,
      programCount: merged.programCount,
      errors: [...fetchErrors, ...merged.errors],
      lastUpdated: now,
      urls,
    });

    return new Response(
      JSON.stringify({
        success: true,
        channelCount: merged.channelCount,
        programCount: merged.programCount,
        errors: [...fetchErrors, ...merged.errors],
        lastUpdated: now,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Refresh error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error during refresh' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
