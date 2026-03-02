import type { APIContext } from 'astro';
import { verifyCredentials, createToken, getSessionSecret, SESSION_COOKIE, SESSION_DURATION_MS } from '../../lib/auth';

export async function POST(context: APIContext) {
  try {
    const formData = await context.request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const env = context.locals.runtime.env;
    const isValid = await verifyCredentials(username, password, env);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const secret = getSessionSecret(env);
    const token = await createToken(
      { username, expiresAt: Date.now() + SESSION_DURATION_MS },
      secret
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Login successful' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}; SameSite=Lax; Secure`,
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(context: APIContext) {
  return new Response(
    JSON.stringify({ success: true, message: 'Logged out successfully' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`,
      },
    }
  );
}
