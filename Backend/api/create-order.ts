/** Vercel entry point for /api/create-order. The handlers live in src/ (see src/routes/index.ts). */
import { endpoints } from '../src/routes/index.js';

const route = endpoints['/api/create-order'];
export const POST = route.POST;
export const OPTIONS = route.OPTIONS;
