import type { APIContext } from 'astro';
import { refreshEPGCache } from '../../lib/epg-cache';
import { EPGStore } from '../../lib/epg-store';

export async function POST(context: APIContext) {
  const kv = context.locals.runtime.env.EPG_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not available' }), { status: 500 });
  }

  try {
    // No need to get URLs from request, refreshEPGCache will fetch from EPGStore
    const refreshedCache = await refreshEPGCache(kv, true); // Force refresh

    if (!refreshedCache) {
      return new Response(
        JSON.stringify({ error: 'Failed to refresh EPG cache' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const store = new EPGStore(kv);
    const sources = await store.getAllSources();
    const errors = sources.map(s => s.lastError).filter(Boolean) as string[];

    return new Response(
      JSON.stringify({
        success: true,
        channelCount: refreshedCache.channels.length,
        programCount: refreshedCache.programs.length,
        errors: errors,
        lastUpdated: refreshedCache.lastUpdated.getTime(),
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
