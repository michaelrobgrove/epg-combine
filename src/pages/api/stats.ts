import { getCache } from '../../lib/epg-cache';

export async function GET() {
  const cache = getCache();

  if (!cache) {
    return new Response(
      JSON.stringify({
        channelCount: 0,
        programCount: 0,
        lastUpdated: null,
        errors: [],
        processingStatus: 'idle',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      channelCount: cache.channelCount,
      programCount: cache.programCount,
      lastUpdated: cache.lastUpdated,
      errors: cache.errors,
      processingStatus: 'idle',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
