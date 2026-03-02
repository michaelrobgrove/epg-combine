// Stateless HMAC-signed session tokens for Cloudflare Workers (stateless execution model)
// Sessions are encoded directly in the cookie — no in-memory storage required.

export interface SessionPayload {
  username: string;
  expiresAt: number; // Unix ms
}

// --- HMAC helpers using Web Crypto API (available in CF Workers) ---

/** Extract a plain ArrayBuffer from a Uint8Array (avoids SharedArrayBuffer typing issues). */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(enc.encode(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(str: string): ArrayBuffer {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer as ArrayBuffer;
}

// Create a signed token: base64url(payload) + '.' + base64url(signature)
export async function createToken(payload: SessionPayload, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(toArrayBuffer(enc.encode(JSON.stringify(payload))));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, toArrayBuffer(enc.encode(payloadB64)));
  return `${payloadB64}.${toBase64Url(sig)}`;
}

// Verify and decode a token. Returns null if invalid or expired.
export async function verifyToken(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return null;

    const key = await getKey(secret);
    const enc = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sigB64),
      toArrayBuffer(enc.encode(payloadB64))
    );
    if (!valid) return null;

    const payload: SessionPayload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadB64))
    );
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

// --- Credential verification ---

export interface CloudflareEnv {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}

export async function verifyCredentials(
  username: string,
  password: string,
  env: CloudflareEnv
): Promise<boolean> {
  const adminUsername = env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = env.ADMIN_PASSWORD ?? 'admin';
  return username === adminUsername && password === adminPassword;
}

export function getSessionSecret(env: CloudflareEnv): string {
  return env.SESSION_SECRET ?? 'default-insecure-secret-change-me';
}

export const SESSION_COOKIE = 'epg_session';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
