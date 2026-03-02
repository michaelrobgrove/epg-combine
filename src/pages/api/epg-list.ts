interface EPGConfig {
  urls: string[];
  lastUpdated?: Date;
}

// NOTE: In Cloudflare Workers (stateless), this resets on every cold start.
// For persistence, migrate to KV storage.
let epgConfig: EPGConfig = {
  urls: [],
  lastUpdated: new Date(),
};

export async function GET() {
  return new Response(
    JSON.stringify({ urls: epgConfig.urls, lastUpdated: epgConfig.lastUpdated }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST({ request }: { request: Request }) {
  try {
    const { urls } = await request.json();

    if (!Array.isArray(urls)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validUrls: string[] = [];
    for (const url of urls) {
      try {
        new URL(url);
        validUrls.push(url.trim());
      } catch {
        // skip invalid URLs
      }
    }

    epgConfig.urls = validUrls;
    epgConfig.lastUpdated = new Date();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'EPG URLs updated successfully',
        urls: epgConfig.urls,
        lastUpdated: epgConfig.lastUpdated,
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

export async function DELETE() {
  epgConfig.urls = [];
  epgConfig.lastUpdated = new Date();

  return new Response(
    JSON.stringify({
      success: true,
      message: 'All EPG URLs cleared successfully',
      urls: epgConfig.urls,
      lastUpdated: epgConfig.lastUpdated,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
