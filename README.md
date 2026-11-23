# Svaraa

Marketing site and pre-order flow for Svaraa, split into two independent apps:

| Folder      | What it is                                                                                     | Tech                                      |
| ----------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `Frontend/` | The website: landing page, Svaraa Fold 3D viewer, pre-order page and form, legal pages          | Vite 7, React 19, TypeScript, Tailwind 4, three.js |
| `Backend/`  | The API behind the pre-order form: Razorpay orders, payment checks, webhook, orders in Supabase | Node 22, TypeScript, Razorpay, Supabase   |

Each has its own `package.json`, `.env` and `.env.example`, and installs, builds and deploys on its own.

```
Svaraa_Demo/
├── Frontend/
│   ├── src/              App code: components/, pages/, data/, lib/, hooks/, legal/
│   ├── public/           Static files: images, logos, team photos, favicon
│   ├── brand/            Logo exports (PNG), not used by the build
│   ├── index.html
│   ├── vite.config.ts    Dev server, including the /api proxy to the backend
│   ├── vercel.json       Rewrites for /pre-order, /terms, … to the single-page app
│   └── .env.example
├── Backend/
│   ├── api/              Vercel entry points, one file per endpoint
│   ├── src/
│   │   ├── server.ts     Standalone Node server (local dev, or any Node host)
│   │   ├── routes/       Endpoint table, shared by server.ts and api/
│   │   ├── controllers/  Create Razorpay order, verify payment, Razorpay webhook
│   │   ├── services/     Razorpay and Supabase clients, recording paid reservations
│   │   ├── middleware/   CORS
│   │   ├── models/       Reservation row types
│   │   ├── shared/       Pre-order rules and validation (prices, quantity limits)
│   │   ├── config/       Environment variables, in one place
│   │   └── utils/        JSON responses
│   ├── supabase/migrations/   Database schema (run once in the Supabase SQL editor)
│   └── .env.example
├── .gitignore
└── README.md
```

## Requirements

Node.js 22.9 or newer, and npm.

## Run locally

Start the backend and the frontend in two terminals.

**Backend** (http://localhost:3001):

```bash
cd Backend
npm install
cp .env.example .env    # then fill in your keys
npm run dev
```

**Frontend** (http://localhost:5173):

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

In development the page calls `/api/...` on its own address and Vite forwards it to the backend at `API_PROXY_TARGET` (default `http://localhost:3001`), so the browser needs no CORS setup. Check the backend with http://localhost:3001/api/health: it reports which integrations are configured, never their values.

The site works without the backend. Only the pre-order form needs it, and without Razorpay and Supabase keys it shows that online reservations are not open yet.

## Environment variables

Secrets live only in `Backend/.env`. Everything in `Frontend/.env` that starts with `VITE_` ends up in the public JavaScript, so it must never hold a key.

**Backend/.env**

| Variable                    | Required        | Purpose                                                                                       |
| --------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `RAZORPAY_KEY_ID`           | To take payments | `rzp_test_…` while testing, `rzp_live_…` when live (Razorpay → Account & Settings → API Keys). Public: the browser gets it to open Checkout. |
| `RAZORPAY_KEY_SECRET`       | To take payments | The key's secret. Signs API calls and payment checks; never leaves the backend.              |
| `RAZORPAY_WEBHOOK_SECRET`   | For the webhook | The secret you set on the `https://<backend>/api/razorpay-webhook` webhook in Razorpay        |
| `SUPABASE_URL`              | To save orders  | The project URL, `https://<project-ref>.supabase.co` (Supabase → Project Settings → Data API). Not the `postgresql://` connection string. |
| `SUPABASE_SERVICE_ROLE_KEY` | To save orders  | Secret server key (Supabase → Project Settings → API Keys)                                    |
| `SITE_URL`                  | In production   | The frontend's public address, e.g. `https://svaraa.ai`. It may call the API. |
| `ALLOWED_ORIGINS`           | Optional        | More frontend origins allowed to call the API (comma-separated), e.g. preview deployments     |
| `RESERVATIONS_WEBHOOK_URL`  | Optional        | Each paid reservation is also POSTed here as JSON                                              |
| `PORT`                      | Optional        | Port for the local server (default 3001)                                                      |

The backend takes payments only when both Razorpay and Supabase are configured, so no order is ever paid without being recorded.

## Payments (Razorpay)

Buyers choose on the form to pay **in rupees** (UPI, Indian cards, netbanking, wallets) or **in US dollars** (international cards). The amounts come from `Backend/src/shared/preorder.ts` (`PRICES`); the browser never sets them. For now the rupee prices are the dollar prices at `USD_TO_INR` (₹100 per $1); change that rate in both copies of the file.

1. The form posts to `/api/create-order`, which saves the pre-order as `pending_payment` and creates a Razorpay order.
2. The browser opens Razorpay Checkout over the page. When the buyer pays, it sends the result to `/api/verify-payment`, which checks the signature with the key secret, confirms (and if needed captures) the payment with Razorpay, and marks the order `reserved`.
3. Razorpay also calls `/api/razorpay-webhook`, so a reservation is recorded even if the buyer closes the tab. Whichever arrives first records it; the other is a no-op.

Set up in the Razorpay dashboard:

- **API keys:** Account & Settings → API Keys. Use test mode keys locally.
- **Webhook:** Account & Settings → Webhooks → add `https://<backend>/api/razorpay-webhook`, choose a secret (put it in `RAZORPAY_WEBHOOK_SECRET`), and tick `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed` and `refund.failed`.
- **US dollar payments:** international payments must be enabled on the account (Account & Settings → International payments, or ask Razorpay support). Until then, rupee payments work and dollar payments are declined by Razorpay.
- **Auto-capture:** keep payments set to capture automatically (Account & Settings → Payment capture). The backend also captures any payment left only authorised.
- **Refunds:** issue them from the Razorpay dashboard; the webhook records them in the database.

**Frontend/.env**

| Variable           | Purpose                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `VITE_API_URL`     | The backend's public address, e.g. `https://api.svaraa.ai`. Leave empty locally to use the proxy. |
| `API_PROXY_TARGET` | Development only: where the local backend runs                                                 |

## Database

Run the files in `Backend/supabase/migrations/` once each, in order, in Supabase → SQL Editor. Each is safe to re-run. `0002_commerce.sql` replaces the single `reservations` table from `0001` (it stops if that table holds orders). `0003_razorpay.sql` switches the payment functions from Stripe to Razorpay.

| Table                  | Holds                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `customers`            | One row per person, keyed by lower-case email                                           |
| `organisations`        | Business buyers, matched by GSTIN (or name when there is none)                          |
| `addresses`            | Delivery addresses. Rows used by an order are never edited; a new address is a new row  |
| `products`             | The catalogue: SKU `SVARAA-FOLD`, list and pre-order price                              |
| `orders`               | One per pre-order: reference, status, quantity, agreed price, amounts due, paid, refunded |
| `order_items`          | The lines charged: reservation fee, or hold fee + booking amount                        |
| `payments`             | Every payment attempt for an order (its Razorpay order and payment ids), and its outcome |
| `refunds`              | Razorpay refunds, with totals rolled up to the payment and order                        |
| `shipments`            | Carrier and tracking, once pendants ship                                                |
| `consents`             | What each buyer agreed to, when, and under which privacy-policy version                 |
| `order_status_history` | Every status change, written by a trigger                                               |
| `webhook_events`       | Every Razorpay webhook event received, so each is handled exactly once                  |

Order statuses: `pending_payment` → `reserved` (or `payment_failed` / `expired`) → `in_production` → `awaiting_balance` → `ready_to_ship` → `shipped` → `delivered`, plus `cancelled` and `refunded`.

Money is stored in the smallest unit of the order's currency: cents for USD (`900` = $9.00), paise for INR (`90000` = ₹900). For a readable list of orders, open the `order_overview` view in the Table Editor. Only the backend's secret key can read or write these tables.

## Scripts

| Folder      | Command             | Does                                                    |
| ----------- | ------------------- | ------------------------------------------------------- |
| `Frontend/` | `npm run dev`       | Dev server with hot reload                              |
|             | `npm run build`     | Type-check and build to `Frontend/dist`                 |
|             | `npm run preview`   | Serve the built site                                    |
| `Backend/`  | `npm run dev`       | API server with reload on change, reading `.env`        |
|             | `npm run build`     | Compile to `Backend/dist`                               |
|             | `npm start`         | Run the compiled server                                 |
|             | `npm run typecheck` | Type-check only                                         |

## Deploy

Deploy the two folders as two separate projects. On Vercel, import the same repository twice and set each project's **Root Directory**.

1. **Backend** (Root Directory `Backend`). Vercel serves each file in `api/` as a function. Add the backend variables above, with `SITE_URL` set to the frontend's address. In Razorpay, add the webhook `https://<backend>/api/razorpay-webhook` (see Payments above). Use live keys (`rzp_live_…`) only in the production project.
   On another Node host, run `npm run build`, then `npm start`.
2. **Frontend** (Root Directory `Frontend`, framework Vite). Set `VITE_API_URL` to the backend's address, then deploy.

## Keeping the pre-order rules in step

Prices and quantity limits are in two places on purpose: `Frontend/src/data/preorder.ts` shows them on the page, and `Backend/src/shared/preorder.ts` decides what is charged. The same goes for `preorderValidation.ts`. If you change a fee, a limit or a validation rule, change both.
