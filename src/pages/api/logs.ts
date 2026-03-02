import { authManager } from '../../lib/auth';
import { logger } from '../../lib/logger';

export async function GET({ cookies, url }: { cookies: any; url: URL }) {
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

  const searchParams = new URL(url.toString()).searchParams;
  const level = searchParams.get('level') as 'debug' | 'info' | 'warn' | 'error' | undefined;
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const logs = logger.getLogs(level, limit);

  return new Response(
    JSON.stringify({
      logs,
      total: logs.length,
      filters: { level, limit }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
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

  logger.clearLogs();

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Logs cleared successfully' 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}