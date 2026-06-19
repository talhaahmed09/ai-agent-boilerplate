# Handoff — M1 Backend

## Status
DONE

## Files created / modified

### Created
- `backend/src/data/productStore.ts` — `ProductStore` interface + `InMemoryProductStore` (4 seeded products, `decrementStock`, `restoreStock`)
- `backend/src/data/orderStore.ts` — `OrderStore` interface + `InMemoryOrderStore` (sequential from 1001)
- `backend/src/plugins/auth.ts` — `requireAuth(req)` helper; throws UNAUTHORIZED if no valid Bearer token
- `backend/src/schemas/orders.ts` — Fastify JSON schema for POST /orders body; `OrderBody` / `ShippingAddressInput` types
- `backend/src/services/orderService.ts` — `placeOrder()`: auth is upstream; validates cart, address fields, stock; decrements stock atomically; creates order
- `backend/src/services/orderService.test.ts` — unit tests for orderService (ERR-2, ERR-3, ERR-4, ERR-5, AC-10, AC-12, stock atomicity, orderNumber, address echo)
- `backend/src/routes/products.ts` — `GET /products` route
- `backend/src/routes/products.test.ts` — ERR-6 coverage
- `backend/src/routes/orders.ts` — `POST /orders` route
- `backend/src/routes/orders.test.ts` — integration tests (ERR-1 through ERR-5, AC-10, AC-12, 201 shape)

### Modified
- `backend/src/lib/errors.ts` — added `UNAUTHORIZED`, `CART_EMPTY`, `ITEMS_UNAVAILABLE` error codes; added `UnavailableItem` interface; extended `AppError` with `unavailableItems`; added `unauthorized()`, `cartEmpty()`, `itemsUnavailable()` factory functions; updated `toEnvelope()` to include `unavailableItems` in envelope
- `backend/src/app.ts` — updated `buildApp` signature to accept `products: ProductStore` and `orders: OrderStore`; registered `productsRoutes` and `ordersRoutes`
- `backend/src/server.ts` — instantiates `InMemoryProductStore` and `InMemoryOrderStore` and passes them to `buildApp`
- `backend/src/routes/register.test.ts` — updated `buildApp` call to pass new required `products` and `orders` deps
- `backend/src/routes/login.test.ts` — updated `buildApp` call to pass new required `products` and `orders` deps

## Tests
| File | Coverage |
|------|---------|
| `src/routes/products.test.ts` | ERR-6: 200 with 4 seeded products; field shape; all 4 IDs present; prod_4 stock=0 |
| `src/routes/orders.test.ts` | ERR-1 (no/empty auth header); ERR-2 (empty items); ERR-3 (missing field, empty field); ERR-4 (partial OOS); ERR-5 (all OOS); AC-10 (backend price, correct total); AC-12 (stock decremented); orderNumber=1001; address echo; optional addressLine2 |
| `src/services/orderService.test.ts` | ERR-2; ERR-3 (fieldErrors content); ERR-4; ERR-5; AC-10 (unitPrice + total); AC-12 (stock decrement); orderNumber starts at 1001 + increments; stock atomicity rollback; address echo; optional addressLine2 |

Total: 55 tests, 7 suites, all passing.

## Deviations from the plan

1. **`ShippingAddressInput` fields made optional in the TypeScript type** (while the JSON schema keeps `shippingAddress` as a required object). Fastify's schema `minLength: 1` was removed from address sub-fields so that missing/empty fields reach the service and produce per-field `fieldErrors` (ERR-3). Without this, Fastify's global error handler would fire first and return a generic VALIDATION without `fieldErrors` pointing to the specific field.

2. **`restoreStock` added to `ProductStore` interface** instead of calling `decrementStock` with negative quantities. This is a cleaner, self-documenting rollback primitive.

3. **`auth.ts` is a plain helper function, not a Fastify plugin** (`FastifyPlugin`). The plan named it a "plugin" but the thin-route pattern calls auth explicitly in the route handler before delegating to the service — a standalone function is simpler, testable, and consistent with the existing codebase.

## Known issues / things the next worker should know

- The global `setErrorHandler` in `app.ts` only maps Fastify schema validation errors to `email`/`password` field names. For the orders route, all meaningful validation is done in the service layer (post-schema), so this is not a problem — but any future route that needs per-field Fastify schema errors for non-auth fields will need the error handler extended.
- `ErrorEnvelope` in `errors.ts` previously declared `fieldErrors` only; it now also carries `unavailableItems`. The frontend contract consumer should be aware of this extended shape.
- No `any` was used without a `// reason:` comment. The one type assertion in `orderService.ts` (casting `ShippingAddressInput` to the strongly-typed address shape after service validation) is accompanied by a `// reason:` comment.

## Commands run + exit codes

| Command | Exit code | Notes |
|---------|-----------|-------|
| `npx tsc --noEmit` | 0 | First run — clean |
| `npx jest --testPathPattern="src/"` | 1 | 2 failures: ERR-3 tests — `fieldErrors.fullName` and `fieldErrors.city` undefined because Fastify schema intercepted before service |
| `npx tsc --noEmit` (after schema fix) | 0 | Clean after making ShippingAddressInput fields optional |
| `npx jest --testPathPattern="src/"` | 0 | 55 passed / 55 total |
| `npx eslint .` | 0 | Clean |

(Multiple lint hook interventions during editing — each fixed immediately before proceeding.)

## Procedure adherence

- [x] Built only my slice, in one repo (`backend/`)
- [x] Built to the API contract exactly (or flagged a needed change above)
- [x] A real test exists for every AC and error state in my slice
- [x] Honoured every constraint in mission-state "Constraints discovered mid-run"
- [x] No new runtime dependencies added
- [x] All demo-only code marked with `// demo:`
- [x] Committed through the gate (did not bypass)
- Deviations: listed above (schema design, restoreStock method, auth helper vs plugin — all improvements, not spec violations)
