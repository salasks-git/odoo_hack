# Subscription and invoice module (Member 2)

This is a starter implementation for the Member 2 part of the shared subscription project. The workspace was empty, so the files here provide the Member 2 backend, a small React interface, and integration notes. Authentication, users, catalog, plans, discounts, payments, and dashboard remain Member 1/3 responsibilities.

## Start here

1. Install Node.js 20 or newer.
2. In a terminal, open this folder and run `cd backend && npm install && npm run dev`.
3. In a second terminal, run `cd frontend && npm install && npm run dev`.
4. For the UI to load real data, connect Member 1's database/auth in `backend/src/index.js` and provide a valid JWT in the UI's Login token field. Until then, the backend deliberately refuses to start without the shared auth and database dependencies.

The backend expects Member 1 to supply `db.js`, `authenticate`, `authorize`, and a `getDiscount(subscription, lines, today)` function. Exact contracts and schema additions are in `docs/INTEGRATION.md`. The backend never creates or modifies Member 1's tables.

## What is implemented

- Subscription create/list/detail/update/delete (delete is limited to draft/quotation), generated `SUB-0001` numbers, line totals and plan minimum quantity validation.
- Enforced status changes: draft → quotation → confirmed → active → closed.
- Billing button endpoint. Each due subscription is processed in a database transaction, invoice period uniqueness prevents double billing, line snapshots are saved, and the next due date advances by the plan period.
- Invoice list/detail, confirm, cancel, and browser print view.
- Customer-only `/subscriptions/mine` and `/invoices/mine` endpoints.
- Plan-based expiry auto-close during a billing run.

Money uses integer cents internally during calculations and is returned as decimal amounts. Dates are `YYYY-MM-DD`. Billing creates draft invoices. Discounts default to zero until Member 1's function is connected.

## API overview

All routes are mounted under `/api`. The authenticated user is expected at `req.user = { id, role }`.

- `GET/POST /subscriptions`; `GET/PATCH /subscriptions/:id`; `POST /subscriptions/:id/status`; `GET /subscriptions/mine`
- `POST /billing/run` (admin or staff)
- `GET /invoices`; `GET /invoices/:id`; `GET /invoices/mine`
- `POST /invoices/:id/confirm`; `POST /invoices/:id/cancel`

Read `docs/INTEGRATION.md` before merging into the shared repo.
