import { defineMiddleware } from 'astro:middleware';
import { authManager } from './lib/auth';

const protectedApiRoutes = [
  '/api/epg-list',
  '/api/stats',
  '/api/channel-info',
  '/api/channel-mappings',
  '/api/logs',
  '/api/search',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;

  // Protect API routes
  if (protectedApiRoutes.some(route => url.pathname.startsWith(route))) {
    const sessionId = context.cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const session = authManager.getSession(sessionId);
    if (!session) {
      // Clear the invalid cookie
      context.cookies.delete('session_id', { path: '/' });
      return new Response('Unauthorized', { status: 401 });
    }

    // Session is valid, proceed
    return next();
  }
  
  // Protect the dashboard page itself
  if (url.pathname === '/dashboard') {
    const sessionId = context.cookies.get('session_id')?.value;
    if (!sessionId) {
      return context.redirect('/');
    }

    const session = authManager.getSession(sessionId);
    if (!session) {
      context.cookies.delete('session_id', { path: '/' });
      return context.redirect('/');
    }
  }

  // For all other requests, continue
  return next();
});
