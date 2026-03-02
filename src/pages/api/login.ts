import { authManager } from '../../lib/auth';

export async function POST({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isValid = await authManager.verifyCredentials(username, password);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = authManager.createSession(username);
    
    // Set HTTP-only cookie
    const response = new Response(
      JSON.stringify({ success: true, message: 'Login successful' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': `session_id=${session.id}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`
        }
      }
    );
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET({ cookies }: { cookies: any }) {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ authenticated: false }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = authManager.getSession(sessionId);
  
  if (!session) {
    return new Response(
      JSON.stringify({ authenticated: false }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ 
      authenticated: true, 
      username: session.username,
      expiresAt: session.expiresAt 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function DELETE({ cookies }: { cookies: any }) {
  const sessionId = cookies.get('session_id');
  
  if (sessionId) {
    authManager.invalidateSession(sessionId);
  }
  
  const response = new Response(
    JSON.stringify({ success: true, message: 'Logged out successfully' }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
      }
    }
  );
  
  return response;
}
