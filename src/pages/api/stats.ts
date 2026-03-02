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
  processingStatus: 'idle',
};

export async function GET() {
  return new Response(JSON.stringify(mockStats), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }: { request: Request }) {
  try {
    const { action } = await request.json();

    if (action === 'update') {
      mockStats.lastUpdated = new Date();
      mockStats.processingStatus = 'processing';

      setTimeout(() => {
        mockStats.processingStatus = 'idle';
        mockStats.channelCount = Math.floor(Math.random() * 100) + 50;
        mockStats.programCount = Math.floor(Math.random() * 1000) + 500;
      }, 1000);

      return new Response(
        JSON.stringify({ success: true, message: 'Statistics update initiated', stats: mockStats }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
