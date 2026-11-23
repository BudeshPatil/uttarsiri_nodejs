# Uttar Siri – Node.js Backend

Centralized API for the Uttar Siri grocery platform (North Karnataka products).

Built on Express 5 + MongoDB (Mongoose). Extends the existing auth/RBAC/CMS foundation with **catalogue, variants, inventory, and multilingual (en / kn / hi)** modules.

## Stack

- Node.js 20+
- Express 5 (ESM)
- MongoDB + Mongoose 9
- JWT auth + role-based access
- Zod validation
- Swagger UI at `/api-docs`
- Winston logging

## Quick start

```bash
cp .env.example .env   # set MONGODB_URI, JWT secrets, CORS_ORIGIN
npm install
npm run seed           # permissions, SUPER_ADMIN, root categories, UI translations
npm run dev            # http://localhost:5004
```

Default seed admin (override with env):

- `SEED_ADMIN_EMAIL` (default `admin@uttarsiri.com`)
- `SEED_ADMIN_PASSWORD` (default `ChangeMe@12345`)

## Phase 1 commerce modules

| Module | Collections | Routes |
|---|---|---|
| Categories / subcategories | `categories` | `/api/categories` |
| Products | `products` | `/api/products` |
| Variants | `product_variants` | `/api/products/:id/variants` |
| Inventory + movements | `inventories`, `stock_movements` | `/api/inventory` |
| Translations | `translations` | `/api/translations/:language` |

### Category APIs

| Method | Path | Auth |
|---|---|---|
| GET | `/api/categories/public` | Public |
| GET | `/api/categories` | Admin roles |
| GET | `/api/categories/:id` | Admin roles |
| POST | `/api/categories` | Admin roles |
| PUT | `/api/categories/:id` | Admin roles |
| DELETE | `/api/categories/:id` | SUPER_ADMIN / ADMIN |

Multilingual fields: `name_en|kn|hi`, `description_en|kn|hi`. Pass `?lang=kn` for localized `name` / `description` with English fallback. Use `?tree=true` for parent/child tree.

### Product APIs

| Method | Path | Auth |
|---|---|---|
| GET | `/api/products/public` | Public |
| GET | `/api/products/search?q=` | Public |
| GET | `/api/products` | Admin roles |
| GET | `/api/products/:id` | Admin roles |
| POST | `/api/products` | Admin roles |
| PUT | `/api/products/:id` | Admin roles |
| DELETE | `/api/products/:id` | SUPER_ADMIN / ADMIN |
| POST | `/api/products/:id/variants` | Admin roles |
| GET | `/api/products/:id/variants` | Admin roles |
| PUT | `/api/products/:id/variants/:variantId` | Admin roles |
| DELETE | `/api/products/:id/variants/:variantId` | SUPER_ADMIN / ADMIN |

Products support multiple `category_ids`, `search_aliases`, and optional nested `variants` on create. Prices and stock are **variant-specific**.

### Inventory APIs

| Method | Path | Auth |
|---|---|---|
| GET | `/api/inventory` | Admin roles |
| GET | `/api/inventory/low-stock` | Admin roles |
| GET | `/api/inventory/:variantId` | Admin roles (includes movement history) |
| PUT | `/api/inventory/:variantId` | Admin roles |

`PUT` body supports:

- absolute: `available_stock`, `reserved_stock`, `low_stock_threshold`
- relative: `adjustment` (+/-), `reserve`, `release`
- audit: `reason`, `movement_type`, `reference_id`

Updating inventory syncs `product_variants.stock_quantity` and auto-marks `out_of_stock` when available stock hits 0.

### Translations

```
GET /api/translations/en
GET /api/translations/kn
GET /api/translations/hi
```

Returns UI strings plus optional catalogue name maps. Missing keys fall back to English.

## Phase 4 — Customer cart, checkout & orders

| Module | Collections | Routes |
|---|---|---|
| Customer auth / profile | `users` (+ `CUSTOMER` role) | `/api/auth/customer/register`, `/api/auth/me` |
| Addresses | `addresses` | `/api/addresses` |
| Server cart | `carts` | `/api/cart` |
| Coupons (admin) | `coupons` | `/api/coupons` |
| Checkout + orders | `orders` | `/api/orders`, `/api/orders/checkout/quote` |

Pricing (subtotal, coupon discount, delivery, tax, total) is calculated **only on the backend**. Checkout never trusts client-submitted prices. Order placement uses a MongoDB transaction with conditional stock `$inc` reservation and idempotency keys to prevent duplicates.

Customer register auto-assigns `CUSTOMER` and `approved` status so storefront login works immediately. Admin email/password login is unchanged.

## Phase 5 — Vendor portal APIs

| Area | Routes |
|---|---|
| Registration | `POST /api/vendors/register` |
| Profile | `GET/PUT /api/vendors/me` |
| Admin approval | `GET /api/vendors`, `PUT /api/vendors/admin/:id/approve\|reject\|suspend` |
| Portal (approved `VENDOR` only) | `/api/vendors/portal/{dashboard,products,inventory,orders,reports}` |

Products created by vendors carry `vendor_id` and start as `draft` / `pending_approval`. Order line items stamp `vendor_id` + `vendor_status` for fulfillment. Ownership is enforced in `vendor.service.js`.

## Architecture (unchanged layering)

```
routes → validators (zod) → controllers → services → repositories → models
```

Existing CMS modules (blogs, banners, services, projects, …) remain mounted and untouched.

## Testing

```bash
npm run test:unit          # i18n + pricing helpers (no DB)
npm run test:integration   # requires MONGODB_URI
npm test                   # both
```

Integration coverage:

- Category + subcategory create
- Product + variants + prices
- Multilingual responses and search (Kannada / English)
- Inventory adjustments + low-stock
- Invalid category assignment rejection
- Cart / coupon / checkout quote / order create + idempotency / insufficient stock

## Docs

- Swagger UI: `http://localhost:5004/api-docs`
- Health: `GET /api/health`
- Phase 0 audits live in the parent Website workspace

## Notes

- Soft delete is used for categories, products, and variants (`is_deleted`).
- Do not repurpose `/api/services` or `/api/projects` for grocery catalogue.
- Production config (`.env`) is not modified by seed defaults beyond reading connection settings.
