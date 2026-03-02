import { defineMiddleware } from 'astro:middleware';
import { verifyToken, getSessionSecret, SESSION_COOKIE } from './lib/auth';

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
  const env = context.locals.runtime?.env ?? {};
  const secret = getSessionSecret(env);

  // Protect API routes
  if (protectedApiRoutes.some(route => url.pathname.startsWith(route))) {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await verifyToken(token, secret);
    if (!session) {
      context.cookies.delete(SESSION_COOKIE, { path: '/' });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Attach session to locals for downstream use
    context.locals.session = session;
    return next();
  }

  // Protect the dashboard page itself
  if (url.pathname === '/dashboard') {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return context.redirect('/');
    }

    const session = await verifyToken(token, secret);
    if (!session) {
      context.cookies.delete(SESSION_COOKIE, { path: '/' });
      return context.redirect('/');
    }

    context.locals.session = session;
  }

  return next();
});
