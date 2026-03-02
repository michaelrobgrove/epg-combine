import { authManager } from '../../lib/auth';

interface ChannelMapping {
  originalId: string;
  mappedId: string;
  sourceFeed?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock channel mappings storage - in a real implementation, this would be D1 database
let channelMappings: ChannelMapping[] = [
  {
    originalId: 'aande.us',
    mappedId: 'a&enetwork.us',
    sourceFeed: 'https://example.com/epg1.xml',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    originalId: 'nbc.us',
    mappedId: 'nbc-network.us',
    sourceFeed: 'https://example.com/epg2.xml',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  }
];

export async function GET({ cookies }: { cookies: any }) {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = authManager.getSession(sessionId);
  
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      mappings: channelMappings,
      total: channelMappings.length
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST({ request, cookies }: { request: Request; cookies: any }) {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = authManager.getSession(sessionId);
  
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { originalId, mappedId, sourceFeed } = await request.json();
    
    if (!originalId || !mappedId) {
      return new Response(
        JSON.stringify({ error: 'Original ID and mapped ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if mapping already exists
    const existingIndex = channelMappings.findIndex(m => 
      m.originalId === originalId && m.sourceFeed === sourceFeed
    );

    const now = new Date();
    
    if (existingIndex >= 0) {
      // Update existing mapping
      channelMappings[existingIndex] = {
        ...channelMappings[existingIndex],
        mappedId,
        updatedAt: now
      };
    } else {
      // Create new mapping
      channelMappings.push({
        originalId,
        mappedId,
        sourceFeed: sourceFeed || undefined,
        createdAt: now,
        updatedAt: now
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Channel mapping saved successfully',
        mappings: channelMappings
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error saving channel mapping:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE({ request, cookies }: { request: Request; cookies: any }) {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = authManager.getSession(sessionId);
  
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { originalId, sourceFeed } = await request.json();
    
    if (!originalId) {
      return new Response(
        JSON.stringify({ error: 'Original ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const initialLength = channelMappings.length;
    channelMappings = channelMappings.filter(m => 
      !(m.originalId === originalId && m.sourceFeed === sourceFeed)
    );

    const deletedCount = initialLength - channelMappings.length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${deletedCount} mapping(s) deleted successfully`,
        mappings: channelMappings
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting channel mapping:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}