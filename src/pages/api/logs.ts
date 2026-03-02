import { logger } from '../../lib/logger';

export async function GET({ url }: { url: URL }) {
  const searchParams = new URL(url.toString()).searchParams;
  const level = searchParams.get('level') as 'debug' | 'info' | 'warn' | 'error' | undefined;
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const logs = logger.getLogs(level, limit);

  return new Response(
    JSON.stringify({ logs, total: logs.length, filters: { level, limit } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function DELETE() {
  logger.clearLogs();
  return new Response(
    JSON.stringify({ success: true, message: 'Logs cleared successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
