# Member 2 integration notes

## Shared ownership

Member 1 owns `users`, `products`, `variants`, `plans`, `discounts`, database initialization, JWT authentication and the shared `getDiscount(subscription, lines, today)` function. Member 3 owns payments and reports. This module adds only Member 2 tables and routes; it does not provide login/catalog/payment routes or replace shared database setup.

## Database contract

The injected database must provide synchronous better-sqlite3-style `prepare(sql).get/all/run`, `transaction(fn)`, and `exec(sql)` methods. Apply `backend/src/schema.sql` once from Member 1's database initialization. It creates `subscriptions`, `subscription_lines`, `invoices`, and `invoice_lines`, with foreign keys into shared users/plans/products/variants. Invoice lines preserve product/variant names, quantity, unit price and tax rate at billing time, so later catalog edits do not rewrite old invoices.

Plan rows are expected to include `id, price, period, min_qty, start_date, end_date, auto_close`. Product rows include `id, name, sales_price`; variants include `id, product_id, value, extra_price`. Subscription lines accept `product_id, variant_id, qty, unit_price, tax_percent`. Member 1's discount result may be `{id, type, value}`; fixed values are currency units and percent values are percentage points. The module increments `discounts.times_used` in the same billing transaction when a valid discount is applied.

## Mounting in Member 1's server

```js
const { createMember2Router } = require('./member2');
app.use('/api', createMember2Router({
  db,
  authenticate,
  authorize,
  getDiscount, // optional until Member 1 hands it off; defaults to no discount
}));
```

`authenticate` must set `req.user` with numeric `id` and `role`. `authorize('admin')` (or the role list supported by Member 1's implementation) should protect write/admin routes. If Member 1's authorize middleware only accepts one role, use a wrapper that permits `admin` and `staff` for billing. Router has no hard dependency on Member 1's auth implementation.

## API behavior and assumptions

- Create/update subscription payload: `{ customer_id, plan_id, start_date, expiry_date?, payment_terms?, lines: [{product_id, variant_id?, qty, unit_price?, tax_percent?}] }`. If unit price is omitted, it is taken from the current product and variant.
- Subscription numbers are generated atomically as `SUB-0001` etc. Draft and quotation may be edited; confirmed/active/closed records are locked.
- Status endpoint body: `{ status }`. Only the next status in the agreed sequence is accepted.
- Invoice numbering is generated atomically as `INV-0001` etc. Billing creates one invoice per subscription period and copies subscription lines into `invoice_lines`.
- `POST /billing/run` body may include `{ today }` for demos; omitted means server's current date. Response includes created, skipped, closed counts and per-subscription errors.
- Due date is invoice creation date plus integer `payment_terms` days; missing payment terms means 0 days.
- Tax is calculated per line on the post-discount allocation, then summed. Discount is capped at the subtotal and allocated proportionally across lines for tax calculation.
- Billing advances the next date once per successful invoice, by the plan period. A duplicate period does not advance it.
- Customer ownership checks are applied to detail and mine routes. Admin/staff can list all invoices and subscriptions.
- Member 3 can extend `GET /invoices` with payment status filtering or mount a more specific route before this router.

## UI integration

The Vite page is a basic learning interface. It expects a JWT in local storage (set through its token field) and calls `/api`. It is not a replacement for Member 1's login flow or shared app shell. Once integrated, replace the token field with the shared auth context.
