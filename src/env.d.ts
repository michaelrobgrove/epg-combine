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
        [key: string]: string | undefined;
      };
    };
    session?: {
      username: string;
      expiresAt: number;
    };
  }
}
