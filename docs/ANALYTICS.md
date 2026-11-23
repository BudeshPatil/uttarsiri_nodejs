# Business analytics API

Admin-only endpoints under `/api/analytics`. All figures come from MongoDB aggregations on live `orders`, `inventories`, `stock_movements`, `users`, `vendors`, and `products` collections — never sample data.

## Auth

`Authorization: Bearer <admin JWT>` with role `SUPER_ADMIN` or `ADMIN`.

## Query filters (all GETs)

| Param | Description |
|-------|-------------|
| `from` / `to` | `YYYY-MM-DD` date range on `created_at` |
| `category_id` | Restrict order line items to products in that category |
| `vendor_id` | Restrict to a vendor’s line items / inventory |
| `granularity` | Sales trends: `day` \| `week` \| `month` |
| `page` / `limit` | Pagination for detailed tables (max 100) |
| `section` | Export only: `overview` \| `sales` \| `orders` \| `products` \| `inventory` \| `customers` \| `vendors` |
| `customer_id` | Customers report: include that customer’s order history |

## Endpoints

| Path | Purpose |
|------|---------|
| `GET /api/analytics/overview` | KPI cards + short sales trend |
| `GET /api/analytics/sales` | Daily/weekly/monthly revenue + trends |
| `GET /api/analytics/orders` | Order status KPIs + paginated orders |
| `GET /api/analytics/products` | Best sellers, low performers, category & variant sales |
| `GET /api/analytics/inventory` | Stock levels, low/out of stock, movements |
| `GET /api/analytics/customers` | Totals, new/repeat, customer list |
| `GET /api/analytics/vendors` | Vendor sales, orders, commission, settlements |
| `GET /api/analytics/export` | Column/row payload for CSV/Excel download in admin UI |

Dashboard home (`GET /api/admin/dashboard`) also embeds the same live commerce KPIs.
