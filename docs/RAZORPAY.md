# Razorpay payment setup (Uttar Siri)

Phase 7 integrates Razorpay for online checkout (UPI, cards, net banking as enabled in your Razorpay dashboard) and optional Cash on Delivery.

## Credentials (never commit real secrets)

| Variable | Where | Purpose |
|----------|--------|---------|
| `RAZORPAY_KEY_ID` | Backend `.env` | Public key id (also returned to the website via `/api/payments/config`) |
| `RAZORPAY_KEY_SECRET` | Backend `.env` only | Signs orders and verifies checkout signatures |
| `RAZORPAY_WEBHOOK_SECRET` | Backend `.env` only | Verifies webhook payloads |
| `RAZORPAY_CURRENCY` | Backend `.env` | Default `INR` |
| `COD_ENABLED` | Backend `.env` | `true` / `false` — show Cash on Delivery |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Website `.env*` (optional) | Same test/live key id for Checkout.js; backend config is preferred |

**Never put `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` in the website or any `NEXT_PUBLIC_*` variable.**

## Test mode

1. Create a Razorpay account and open **Test Mode**.
2. Copy **Key Id** and **Key Secret** from [API Keys](https://dashboard.razorpay.com/app/keys).
3. Add them to `uttarsiri_nodejs/.env` (see `.env.example`).
4. Restart the API (`npm run dev`).
5. Place an online order on the website; Razorpay Checkout opens with test methods.
6. Use Razorpay [test cards / UPI](https://razorpay.com/docs/payments/payments/test-card-upi-details/).

## Webhook (required for reliable status)

1. Razorpay Dashboard → **Webhooks** (Test mode).
2. URL: `https://<your-api-host>/api/payments/webhook`
3. Secret: set the same value as `RAZORPAY_WEBHOOK_SECRET`.
4. Enable at least: `payment.captured`, `payment.failed`, `payment.authorized`, `order.paid`, `refund.processed` / `refund.created`.

Local tip: use a tunnel (ngrok/cloudflared) pointing to `http://localhost:5004`.

## API surface

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/payments/config` | Public | Enabled methods, COD flag, key id |
| POST | `/api/payments/create` | Customer JWT | Creates Razorpay order from **server** order total |
| POST | `/api/payments/verify` | Customer JWT | Verifies checkout signature; marks paid |
| POST | `/api/payments/fail` | Customer JWT | Records failed / dismissed checkout |
| POST | `/api/payments/webhook` | Razorpay signature | Idempotent status updates |
| GET | `/api/payments/order/:orderId` | Customer JWT | Payment record for an order |
| POST | `/api/payments/refund` | Admin JWT | Initiates refund workflow |

`POST /api/orders` still creates the commerce order (server-side pricing). For UPI/card/netbanking it also attaches a `payment` checkout payload. Order `payment_status` becomes `paid` **only** after verified signature or webhook — never from the frontend alone.

## Idempotency

- Order create: `idempotency_key` on `/api/orders`
- Payment create: `idempotency_key` / `Idempotency-Key` header
- Webhook / verify: `processed_event_ids` on the payment document prevents double capture

## Going live

1. Switch Razorpay to **Live Mode** keys.
2. Update env on the server and rebuild/restart API + website.
3. Point the webhook to the production API URL.
4. Confirm `COD_ENABLED` as needed.
5. Smoke-test a small live payment and refund in admin.
