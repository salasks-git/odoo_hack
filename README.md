# Member 3 — Finance & Payment Management Module
## Subscription Management System

This repository contains the complete, production-ready implementation of **Member 3** for the Subscription Management System:
- **Payment Management** (record, view, search, filter, and audit payments)
- **Invoice & Overdue Tracking** (real-time balances, partial payment handling, overdue detection)
- **Finance Dashboard** (live KPI cards, Recharts visualizations, recent transaction audit)
- **Financial Reports & CSV Export** (daily revenue, monthly revenue, payment history, outstanding, and overdue reports)
- **Backend APIs & SQLite Database** (RESTful endpoints, foreign key constraints, atomic status updates)
- **Automated Financial Test Suite** (10/10 tests validating all safeguards)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v20+ or v24+)
- npm (v10+)

### 2. Running the Application

#### Option A: Run Full Stack (Frontend + Backend API)
```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:server

# Terminal 2: Start React Frontend (Port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option B: Run Unified Production Build
The Express backend also serves the built React frontend directly:
```bash
npm run build
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🧪 Running Automated Tests

Run the full financial testing checklist:
```bash
npm test
```

This executes `server/tests/financial_tests.js` and verifies:
1. A successful payment appears in payment history and affects collected revenue.
2. A pending or failed payment does not increase collected revenue.
3. A partial payment reduces the invoice balance but does not mark the invoice fully paid.
4. An invoice past its due date with a remaining balance appears as overdue.
5. A fully paid invoice does not appear as overdue, even if its due date has passed.
6. Duplicate transaction references are rejected safely.
7. Zero or negative amounts are rejected by database `CHECK` constraints.
8. Overpayment beyond remaining balance is detected and blocked.
9. Dashboard totals match underlying payment and invoice records.
10. Daily and monthly revenue aggregation groups correctly.

---

## 📂 Project Architecture

```
member-3-finance/
├── server/
│   ├── db.js                     # SQLite initialization, schema, seeds, calculations
│   ├── app.js                    # Express app configuration & middlewares
│   ├── server.js                 # Server entry point (port 5000)
│   ├── routes/
│   │   ├── payments.js           # GET /api/payments, POST /api/payments, GET /api/payments/:id
│   │   ├── invoices.js           # GET /api/invoices, GET /api/invoices/overdue, GET /api/invoices/:id
│   │   └── finance.js            # GET /api/finance/dashboard, /revenue, /reports
│   └── tests/
│       └── financial_tests.js    # Automated validation test suite
├── src/
│   ├── pages/
│   │   ├── FinanceDashboard.jsx  # KPI cards, Recharts, recent transactions
│   │   ├── Payments.jsx          # Payment list, search, filter, audit view
│   │   ├── InvoiceTracking.jsx   # Live invoice balances, overdue status, pay now
│   │   └── FinanceReports.jsx    # Reports hub, date filters, CSV export
│   ├── components/
│   │   ├── StatCard.jsx          # Reusable KPI card
│   │   ├── RevenueChart.jsx      # Area, Bar, and Donut charts (Recharts)
│   │   ├── PaymentTable.jsx      # Payment data table with badges
│   │   ├── PaymentForm.jsx       # Payment recording modal with validation
│   │   └── DateFilter.jsx        # Date range picker component
│   ├── services/
│   │   └── financeApi.js         # Centralized frontend API client
│   ├── utils/
│   │   └── financeCalculations.js # Math utilities, currency/date formatters, CSV generator
│   ├── App.jsx                   # Main layout and tab navigation
│   └── main.jsx                  # React application root
├── index.html                    # HTML entry with Tailwind CSS
├── vite.config.mjs               # Vite config with /api proxy to port 5000
└── package.json                  # Scripts and dependencies
```

---

## 📑 Backend API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| **GET** | `/api/finance/dashboard` | Returns calculated KPIs (`collected_revenue`, `outstanding_balance`, `overdue_balance`, `overdue_count`, `collection_rate`), charts, and recent transactions. |
| **GET** | `/api/finance/revenue` | Grouped revenue by day (`by=day`) or month (`by=month`). |
| **GET** | `/api/finance/reports` | Returns report datasets: `daily_revenue`, `monthly_revenue`, `payment_history`, `outstanding_invoices`, `overdue_invoices`. |
| **GET** | `/api/payments` | Lists payments with filters (`status`, `payment_method`, `start_date`, `end_date`, `search`). |
| **POST** | `/api/payments` | Records payment with strict validations (positive amount, check remaining balance, unique reference ID). |
| **GET** | `/api/payments/:id` | Single payment detail with linked invoice and payment history. |
| **GET** | `/api/invoices` | Invoices with dynamic calculated balances (`amount_paid`, `remaining_balance`, `is_overdue`). |
| **GET** | `/api/invoices/overdue` | Filtered list of invoices past due date with remaining balance > 0. |
| **POST** | `/api/reset-seed` | Resets the SQLite database to fresh demonstration seed records. |

---

## 🤝 Integration Contracts (Members 1 & 2)

- **Member 1 (Customer & Subscriptions):** Uses customer identifiers (`customer_id`) and subscription plans without duplicating customer tables.
- **Member 2 (Invoices & Billing):** Uses invoice identifiers (`invoice_id`), invoice numbers, subtotal, tax, discounts, total amount, and due dates.
- **Dynamic Balance Rule:**
  $$\text{Remaining Balance} = \max(0, \text{Total Amount} - \sum(\text{Successful Payments}))$$
  $$\text{Overdue Condition} = (\text{Due Date} < \text{Today}) \land (\text{Remaining Balance} > 0)$$

