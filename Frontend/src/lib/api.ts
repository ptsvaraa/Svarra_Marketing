/**
 * Where the backend API lives, e.g. https://api.svaraa.ai. Empty means the same
 * origin as this page: in development, Vite forwards /api to the local backend.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
