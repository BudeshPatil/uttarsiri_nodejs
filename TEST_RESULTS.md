# Phase 1 – Test Results

**Date:** 18 November 2026  
**Repo:** `uttarsiri_nodejs`  
**Runner:** Node.js built-in test runner (`node --test`)

## Unit tests (`npm run test:unit`)

| Test | Result |
|---|---|
| normalizeLanguage falls back to English | PASS |
| localizeField falls back to English when Kannada missing | PASS |
| withLocalizedFields adds convenience name/description | PASS |
| slugify produces url-safe English slugs | PASS |

**Summary:** 4/4 passed

## Integration tests (`npm run test:integration`)

Requires `MONGODB_URI` (ran against local MongoDB database `innova_db`).

| Test | Result |
|---|---|
| creates parent category with multilingual names | PASS |
| creates subcategory under parent | PASS |
| creates product with variants and prices | PASS |
| returns localized product fields with English fallback | PASS |
| searches by Kannada and English names | PASS |
| updates inventory and writes movement history | PASS |
| flags low stock | PASS |
| translations endpoint data includes UI and fallback | PASS |
| rejects invalid product create payload via service guards | PASS |

**Summary:** 10/10 passed (suite + nested cases)

## Manual API checklist

After `npm run seed` and `npm run dev`:

1. `GET /api/health` → 200  
2. `GET /api/categories/public?lang=kn` → seeded North Karnataka categories  
3. `POST /api/auth/login` → admin JWT  
4. `POST /api/categories` → create subcategory  
5. `POST /api/products` with nested variants  
6. `GET /api/products/search?q=ಜೋಳ` → Kannada search  
7. `PUT /api/inventory/:variantId` with `{ "adjustment": -1 }`  
8. `GET /api/inventory/low-stock`  
9. `GET /api/translations/hi`  
10. `GET /api-docs` → Swagger includes Categories / Products / Inventory / Translations  

## Notes

- Mongoose emits a deprecation warning for `new: true` on `findOneAndUpdate` (existing BaseRepository pattern). Non-blocking; can migrate to `returnDocument: 'after'` later.  
- Integration tests create disposable documents with a timestamp suffix; they soft-delete is not cleaned up automatically (safe for local/dev DB).
