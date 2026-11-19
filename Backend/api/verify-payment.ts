/** Vercel entry point for /api/verify-payment. The handlers live in src/ (see src/routes/index.ts). */
import { endpoints } from '../src/routes/index.js';

const route = endpoints['/api/verify-payment'];
export const POST = route.POST;
export const OPTIONS = route.OPTIONS;
