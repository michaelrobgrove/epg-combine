/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ADMIN_USERNAME?: string;
  readonly ADMIN_PASSWORD?: string;
  readonly SESSION_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        ADMIN_USERNAME?: string;
        ADMIN_PASSWORD?: string;
        SESSION_SECRET?: string;
        EPG_KV?: KVNamespace;
        [key: string]: string | KVNamespace | undefined;
      };
    };
    session?: {
      username: string;
      expiresAt: number;
    };
  }
}

// Cloudflare Workers KV types
interface KVNamespace {
  get(key: string, options?: { type?: 'text' }): Promise<string | null>;
  get<T = unknown>(key: string, options: { type: 'json' }): Promise<T | null>;
  get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
  get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number; expiration?: number; metadata?: Record<string, unknown> }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string; expiration?: number; metadata?: Record<string, unknown> }>; list_complete: boolean; cursor?: string }>;
}
