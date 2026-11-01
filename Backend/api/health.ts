/** Vercel entry point for /api/health. The handlers live in src/ (see src/routes/index.ts). */
import { endpoints } from '../src/routes/index.js';

const route = endpoints['/api/health'];
export const GET = route.GET;
export const OPTIONS = route.OPTIONS;
