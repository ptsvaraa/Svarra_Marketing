/** Vercel entry point for /api/razorpay-webhook. The handlers live in src/ (see src/routes/index.ts). */
import { endpoints } from '../src/routes/index.js';

const route = endpoints['/api/razorpay-webhook'];
export const POST = route.POST;
