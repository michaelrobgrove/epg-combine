import type { APIContext } from 'astro';
import { EPGStore, urlToId } from '../../lib/epg-store';

export async function GET(context: APIContext) {
  const kv = context.locals.runtime.env.EPG_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not available' }), { status: 500 });
  }
  const store = new EPGStore(kv);
  const sources = await store.getAllSources();
  const urls = sources.map(s => s.url);
  const lastUpdated = sources.length > 0 ? new Date(Math.max(...sources.map(s => s.lastFetch || 0))) : null;

  return new Response(
    JSON.stringify({ urls, lastUpdated }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(context: APIContext) {
  const kv = context.locals.runtime.env.EPG_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not available' }), { status: 500 });
  }
  const store = new EPGStore(kv);

  try {
    const { urls } = await context.request.json();

    if (!Array.isArray(urls)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validUrls: string[] = [];
    const newUrls: string[] = [];
    for (const url of urls) {
      try {
        new URL(url);
        validUrls.push(url.trim());
        const existing = await store.getSourceByUrl(url.trim());
        if (!existing) {
          newUrls.push(url.trim());
        }
      } catch {
        // skip invalid URLs
      }
    }

    // Delete sources that are no longer in the list
    const existingSources = await store.getAllSources();
    for (const source of existingSources) {
      if (!validUrls.includes(source.url)) {
        await store.deleteSource(source.id);
      }
    }

    // Add new sources
    for (const url of newUrls) {
      await store.addSource(url);
    }

    const updatedSources = await store.getAllSources();
    const updatedUrls = updatedSources.map(s => s.url);
    const lastUpdated = updatedSources.length > 0 ? new Date(Math.max(...updatedSources.map(s => s.lastFetch || 0))) : null;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'EPG URLs updated successfully',
        urls: updatedUrls,
        lastUpdated: lastUpdated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating EPG URLs:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(context: APIContext) {
  const kv = context.locals.runtime.env.EPG_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not available' }), { status: 500 });
  }
  const store = new EPGStore(kv);
  const sources = await store.getAllSources();
  for (const source of sources) {
    await store.deleteSource(source.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'All EPG URLs cleared successfully',
      urls: [],
      lastUpdated: null,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
