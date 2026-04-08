/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_PUBLIC_KEY: string;
  readonly VITE_PEER_HOST: string;
  readonly VITE_PEER_PORT: string;
  readonly VITE_PEER_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
