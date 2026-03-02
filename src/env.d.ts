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