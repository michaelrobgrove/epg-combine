import { authManager } from '../../lib/auth';

// Mock statistics data - in a real implementation, this would come from KV/D1 storage
interface Statistics {
  channelCount: number;
  programCount: number;
  lastUpdated: Date;
  errors: string[];
  processingStatus: 'idle' | 'processing' | 'error';
}

let mockStats: Statistics = {
  channelCount: 0,
  programCount: 0,
  lastUpdated: new Date(),
  errors: [],
  processingStatus: 'idle'
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
    JSON.stringify(mockStats),
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
    const { action } = await request.json();
    
    if (action === 'update') {
      // Simulate updating statistics
      mockStats.lastUpdated = new Date();
      mockStats.processingStatus = 'processing';
      
      // Simulate some processing time
      setTimeout(() => {
        mockStats.processingStatus = 'idle';
        mockStats.channelCount = Math.floor(Math.random() * 100) + 50;
        mockStats.programCount = Math.floor(Math.random() * 1000) + 500;
      }, 1000);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Statistics update initiated',
          stats: mockStats
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating stats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}