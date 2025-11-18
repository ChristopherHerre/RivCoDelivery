# RivCo Delivery API Security & Validation Audit

## Summary
- **Authentication & Sessions**: Google login always assigns role `0`; sessions omit role; no CSRF defense; session cookie not `secure` in prod.
- **Access Control**: `checkRole` relies on DB lookup each request with no caching; several admin routes allow self-role changes or admin demotion after recent relaxations.
- **Validation Coverage**: Many POST/PUT routes use Zod, but numerous GET and admin routes still lack parameter/query validation; `/api/co`, `/api/cart`, and `/api/menu-items` remain high risk.
- **Data Integrity**: Cart and order flows trust client-sent pricing data; no server-side recomputation; multi-tenant ownership checks inconsistent on read routes.
- **Operational Concerns**: Logging leaks sensitive payloads (cart, sessions); rate limiting applied only to `/api/co`; Google Maps API key exposed to any authenticated caller.

## High-Priority Remediation
1. Reinstate hardened login/session handling (persist DB role, include in session, enforce secure cookies, re-enable CSRF).
2. Lock down `/api/users/:id/role` (block self-change, prevent admin demotion, add audit log sink) and `/api/users/:id/restaurant` (Zod validation + restaurant ownership check).
3. Rework `/api/co` and `/api/cart` to validate with Zod, recompute totals server-side, enforce single-restaurant carts, and add idempotency + retry on deadlock.
4. Add Zod param/query validation to remaining read routes (menu, restaurants, orders, search) and sanitize LIKE queries.
5. Remove `/api/maps-api-key` or restrict to trusted origins; stop logging sensitive data in production; expand rate limiting to auth/admin endpoints.

## Route-by-Route Findings
| Method | Route | Current Validation / Security | Gaps & Risks | Recommended Action |
| --- | --- | --- | --- | --- |
| DELETE | `/api/menu-item-ingredients/:ingredient_id` | Uses Zod params, restaurant ownership checks, transactional | Solid | None |
| DELETE | `/api/menu-items/:id` | Zod params; deletes mappings and item | Solid | None |
| POST | `/api/menu-item-ingredients` | Zod body; optional menu mapping | Add restaurant ownership check on read | Verify menu-item belongs to same restaurant before mapping |
| PUT | `/api/menu-ingredients/:id` | Zod body; restaurant ownership check | **No param validation** | Add `id` schema |
| POST | `/api/addRestaurant` | Zod body | Solid | None |
| POST | `/api/manageRestaurant` | Zod body, ownership checks | Solid | None |
| POST | `/api/update-menu-item/:id` | Zod body, ownership check | **No param validation**, dynamic SQL | Add param schema; whitelist update fields (already) |
| POST | `/api/menu-items` | Manual required check | **No Zod**, no ownership check | Validate both IDs, ensure same restaurant |
| POST | `/api/add-menu-item` | Zod body, restaurant ownership | Solid | None |
| GET | `/api/menu-items-list` | Requires role 2; ownership check | Returns 403 if zero results | Acceptable |
| DELETE | `/api/menu-item-ingredients/:ingredient_id` | (Duplicate route as first) | — | — |
| PUT | `/api/users/:id/role` | Zod params/body, transaction | Self-change allowed, admin demotion allowed (guard commented) | Reinstate self-change block, admin guard; return updated role |
| PUT | `/api/users/:id/restaurant` | No validation | **Missing Zod**, no restaurant existence check | Validate params/body; ensure restaurant exists and belongs to caller |
| PUT | `/api/users/:id/selected_restaurant` | Zod params/body | Allows selecting any restaurant | Restrict to restaurants visible to user |
| POST | `/api/cart` | Manual parsing | **No Zod**, trusts client data, logs full cart | Reintroduce Zod schema, clamp lengths, remove logs |
| GET | `/api/cart` | None | JSON parse errors handled; no validation | Optionally validate result before return |
| POST | `/api/user/address` | None | **No schema**, possible invalid coords | Add Zod for address + lat/long range |
| GET | `/api/user/address` | None | Acceptable | Optionally sanitize |
| PUT | `/api/user/address` | None | Clears address blindly | Add auth + audit (exists) |
| POST | `/api/changeOrderOpen` | Zod schema | Solid | None |
| GET | `/api/orders` | No query validation | **Pagination unchecked**, uses string limit/offset | Use Zod to bound page/limit |
| POST | `/api/google-login` | Manual token handling | Role forced to 0, session missing role, no schema, clears sessions | Use Zod; fetch DB role; include role in session |
| POST | `/api/co` | Manual array checks | **Critical**: trusts client totals, no Zod, no ownership check | Validate payload, recompute totals, restrict to single restaurant |
| GET | `/api/checkout-data/:selected_restaurant?` | Zod params; cart/address typed | No restaurant ownership check | Ensure selected restaurant belongs to user or is public |
| GET | `/api/sponsors` | None | Public data | Low risk |
| GET | `/api/menu-ingredients/:menuItem` | None | **No param validation**, ownership missing | Add Zod; ensure belongs to user |
| GET | `/api/menu-items` | None | Exposes all menu ingredient mappings | Add ownership filter and pagination |
| GET | `/api/getUserRestaurant` | Ownership check | Solid | None |
| GET | `/api/maps-api-key` | None | Exposes API key broadly | Restrict or proxy |
| GET | `/api/restaurants/:latitude/:longitude` | parseFloat only | **No range validation** | Add Zod for lat/long |
| POST | `/api/cart` (duplicate) | — | — | — |
| GET | `/api/restaurants2/:restaurantId/menu` | None | No param validation, no ownership | Add Zod; restrict to available restaurants |
| GET | `/api/menu/item/search` | None | No query validation, LIKE injection risk | Validate string, escape `%/_` |
| GET | `/api/users` | None | Pagination + search unsanitized | Zod for page/limit/query; parameterize LIMIT via placeholders |
| GET | `/api/menu/item/ingredients` | None | No param validation | Add schema |
| GET | `/api/order_items` | None | No param validation | Add schema |
| GET | `/api/restaurants/:restaurant` | None | No param validation | Add schema |
| GET | `/api/menu/item` | None | No param validation | Add schema |
| GET | `/api/user/orders` | None | Pagination unchecked | Add Zod for page/limit |
| GET | `/api/auth/google`, `/api/auth/google/callback`, `/api/logout`, `/api/health` | — | Minimal risk | Ensure callback uses HTTPS |

## Additional Recommendations
- **CSRF**: Re-enable `csurf` middleware for all state-changing routes.
- **Rate Limiting**: Extend limiter to login, role updates, menu/restaurant mutations.
- **Logging**: Remove cart/session dumps; redact sensitive details; use structured logging with levels.
- **Secrets Handling**: Lock down `/api/maps-api-key` or move to server-side proxy.
- **Testing**: Add integration tests for validation failures to prevent regressions.
