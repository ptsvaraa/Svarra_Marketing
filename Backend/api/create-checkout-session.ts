/** Vercel entry point for /api/create-checkout-session. The handlers live in src/ (see src/routes/index.ts). */
import { endpoints } from '../src/routes/index.js';

const route = endpoints['/api/create-checkout-session'];
export const POST = route.POST;
export const OPTIONS = route.OPTIONS;
