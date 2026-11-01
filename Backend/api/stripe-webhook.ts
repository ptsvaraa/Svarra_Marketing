/** Vercel entry point for /api/stripe-webhook. The handlers live in src/ (see src/routes/index.ts). */
import { endpoints } from '../src/routes/index.js';

const route = endpoints['/api/stripe-webhook'];
export const POST = route.POST;
