# Member 2 & Member 3 integration notes

## Shared ownership

- **Member 1:** Owns `users`, `products`, `variants`, `plans`, `discounts`, database initialization, JWT authentication and the shared `getDiscount(subscription, lines, today)` function.
- **Member 2:** Owns `subscriptions`, `subscription_lines`, `invoices`, `invoice_lines`, and recurring billing runs.
- **Member 3:** Owns `payments`, payment management, invoice balance updates, overdue invoice tracking, finance dashboard, and financial reports.

## Database contract

The injected database must provide synchronous better-sqlite3-style `prepare(sql).get/all/run`, `transaction(fn)`, and `exec(sql)` methods. Apply `backend/src/schema.sql` once from Member 1's database initialization. It creates:
- `subscriptions`, `subscription_lines`, `invoices`, `invoice_lines` (Member 2)
- `payments` (Member 3) with foreign key referencing `invoices(id)`

## Mounting in Member 1's server

```js
const { createMember2Router } = require('./member2');
const { createMember3Router } = require('./member3');

// Mount Member 2 Subscriptions & Invoicing
app.use('/api', createMember2Router({ db, authenticate, authorize, getDiscount }));

// Mount Member 3 Payments & Financial Reports
app.use('/api', createMember3Router({ db, authenticate, authorize }));
```

## Member 3 API Endpoints

- `GET /api/finance/dashboard`: Returns real-time KPI metrics, charts data, recent transactions, and recent overdue accounts.
- `GET /api/finance/revenue`: Revenue aggregation grouped by `by=day` or `by=month`.
- `GET /api/finance/reports`: Filtered report datasets for `daily_revenue`, `monthly_revenue`, `payment_history`, `outstanding_invoices`, and `overdue_invoices`.
- `GET /api/payments`: Lists payments with search, pagination, status, and method filters.
- `POST /api/payments`: Records a verified payment with duplicate transaction ID checks and remaining balance safeguards.
- `GET /api/payments/:id`: Returns single payment details with audit history and linked invoice info.
- `GET /api/invoices/balances`: Evaluates all invoices with dynamic `amount_paid`, `remaining_balance`, and `is_overdue` status.
- `GET /api/invoices/overdue`: Returns only invoices past their due date with a positive remaining balance.

## Financial Safeguards Enforced by Member 3
1. Non-successful payments (`Pending`, `Failed`, `Refunded`) never count towards collected revenue.
2. Duplicate transaction reference IDs are rejected.
3. Overpayment exceeding remaining invoice balance is blocked when recording a successful payment.
4. An invoice is only marked paid when remaining balance reaches zero.
5. Invoices are flagged overdue only if due date has passed AND positive balance remains.
