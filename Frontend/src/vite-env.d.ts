/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API address, e.g. https://api.svaraa.ai. Empty: same origin (dev proxy). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
