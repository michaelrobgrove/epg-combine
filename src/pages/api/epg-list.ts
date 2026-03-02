import { authManager } from '../../lib/auth';

interface EPGConfig {
  urls: string[];
  lastUpdated?: Date;
}

let epgConfig: EPGConfig = {
  urls: [],
  lastUpdated: new Date()
};

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
      urls: epgConfig.urls,
      lastUpdated: epgConfig.lastUpdated
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
    const { urls } = await request.json();
    
    if (!Array.isArray(urls)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate URLs
    const validUrls: string[] = [];
    for (const url of urls) {
      try {
        new URL(url);
        validUrls.push(url.trim());
      } catch (error) {
        // Skip invalid URLs
      }
    }

    epgConfig.urls = validUrls;
    epgConfig.lastUpdated = new Date();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'EPG URLs updated successfully',
        urls: epgConfig.urls,
        lastUpdated: epgConfig.lastUpdated
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

export async function DELETE({ cookies }: { cookies: any }) {
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

  epgConfig.urls = [];
  epgConfig.lastUpdated = new Date();

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'All EPG URLs cleared successfully',
      urls: epgConfig.urls,
      lastUpdated: epgConfig.lastUpdated
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}