/// <reference types="astro/client" />

// Environment variable types
interface ImportMetaEnv {
  readonly ADMIN_USERNAME: string;
  readonly ADMIN_PASSWORD: string;
  readonly KV_NAMESPACE?: string;
  readonly D1_DATABASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals extends astroHTML.Locals {
    runtime: {
      env: {
        ADMIN_USERNAME: string;
        ADMIN_PASSWORD: string;
      };
    };
  }
}
