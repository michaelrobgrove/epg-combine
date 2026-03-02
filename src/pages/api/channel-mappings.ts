interface ChannelMapping {
  originalId: string;
  mappedId: string;
  sourceFeed?: string;
  createdAt: Date;
  updatedAt: Date;
}

let channelMappings: ChannelMapping[] = [
  {
    originalId: 'aande.us',
    mappedId: 'a&enetwork.us',
    sourceFeed: 'https://example.com/epg1.xml',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    originalId: 'nbc.us',
    mappedId: 'nbc-network.us',
    sourceFeed: 'https://example.com/epg2.xml',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
];

export async function GET() {
  return new Response(
    JSON.stringify({ mappings: channelMappings, total: channelMappings.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST({ request }: { request: Request }) {
  try {
    const { originalId, mappedId, sourceFeed } = await request.json();

    if (!originalId || !mappedId) {
      return new Response(
        JSON.stringify({ error: 'Original ID and mapped ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const existingIndex = channelMappings.findIndex(
      m => m.originalId === originalId && m.sourceFeed === sourceFeed
    );

    if (existingIndex >= 0) {
      channelMappings[existingIndex] = { ...channelMappings[existingIndex], mappedId, updatedAt: now };
    } else {
      channelMappings.push({ originalId, mappedId, sourceFeed: sourceFeed || undefined, createdAt: now, updatedAt: now });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Channel mapping saved successfully', mappings: channelMappings }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error saving channel mapping:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    const { originalId, sourceFeed } = await request.json();

    if (!originalId) {
      return new Response(JSON.stringify({ error: 'Original ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const before = channelMappings.length;
    channelMappings = channelMappings.filter(
      m => !(m.originalId === originalId && m.sourceFeed === sourceFeed)
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `${before - channelMappings.length} mapping(s) deleted successfully`,
        mappings: channelMappings,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting channel mapping:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
