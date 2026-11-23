/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API address, e.g. https://api.svaraa.ai. Empty: same origin (dev proxy). */
  readonly VITE_API_URL?: string;
  /** Supabase project URL, for customer accounts (public). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon / publishable key (public; never the service-role key). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
