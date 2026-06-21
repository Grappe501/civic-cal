/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNCTIONS_BASE?: string;
  readonly VITE_USE_SEED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
