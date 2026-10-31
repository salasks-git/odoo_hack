// This entry point mounts Member 2 & 3 into Member 1's shared runtime,
// or provides a self-contained SQLite dev database if run standalone.
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { createApp } = require('./index');

let db = null;
let authenticate = (_req, _res, next) => next();
let authorize = () => (_req, _res, next) => next();
let getDiscount = () => null;

if (process.env.SHARED_DB_MODULE) {
  try {
    const dbModule = require(path.resolve(process.env.SHARED_DB_MODULE));
    db = dbModule.db || dbModule;
    if (process.env.SHARED_AUTH_MODULE) {
      const authModule = require(path.resolve(process.env.SHARED_AUTH_MODULE));
      authenticate = authModule.authenticate || authenticate;
      authorize = authModule.authorize || authorize;
    }
    if (process.env.SHARED_DISCOUNT_MODULE) {
      const discountModule = require(path.resolve(process.env.SHARED_DISCOUNT_MODULE));
      getDiscount = discountModule.getDiscount || getDiscount;
    }
  } catch (err) {
    console.warn(`[Dev Server] Could not load shared module: ${err.message}. Starting with dev database.`);
  }
}

if (!db) {
  const dbFile = path.resolve(__dirname, '../dev_finance.db');
  db = new DatabaseSync(dbFile);
  db.exec('PRAGMA foreign_keys = ON;');

  // Apply schema.sql
  const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schemaSql);

  // Apply demo seed records if empty
  const subCount = db.prepare('SELECT COUNT(*) as c FROM subscriptions').get().c;
  if (subCount === 0) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        period TEXT NOT NULL,
        min_qty REAL NOT NULL DEFAULT 1,
        start_date TEXT,
        end_date TEXT,
        auto_close INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sales_price REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id),
        value TEXT NOT NULL,
        extra_price REAL NOT NULL DEFAULT 0
      );

      INSERT INTO users (id, name, email) VALUES
      (1, 'Aarav Patel', 'aarav@pateltech.in'),
      (2, 'Sarah Jenkins', 's.jenkins@cloudnexus.io'),
      (3, 'Vikram Malhotra', 'vikram@malhotramedia.in'),
      (4, 'Elena Rostova', 'elena@nordicdata.se'),
      (5, 'Devon Vance', 'devon@vancelogistics.com');

      INSERT INTO plans (id, name, price, period) VALUES
      (1, 'Enterprise Scale Plan', 25000, 'monthly'),
      (2, 'Pro Developer Plan', 12000, 'monthly'),
      (3, 'Media Studio Ultimate', 45000, 'monthly');

      INSERT INTO products (id, name, sales_price) VALUES
      (1, 'Cloud Hosting Core', 15000),
      (2, 'Dedicated Support SLA', 10000);

      INSERT INTO subscriptions (id, number, customer_id, plan_id, start_date, status, next_billing_date) VALUES
      (1, 'SUB-0001', 1, 1, '2026-01-01', 'active', '2026-11-01'),
      (2, 'SUB-0002', 2, 2, '2026-02-15', 'active', '2026-11-15'),
      (3, 'SUB-0003', 3, 3, '2026-01-10', 'active', '2026-11-10');

      INSERT INTO invoices (id, number, subscription_id, customer_id, period_start, subtotal, discount, tax, total, status, due_date) VALUES
      (1, 'INV-0001', 1, 1, '2026-09-01', 25000, 0, 4500, 29500, 'paid', '2026-09-15'),
      (2, 'INV-0002', 2, 2, '2026-09-05', 12000, 1000, 2160, 13160, 'paid', '2026-09-20'),
      (3, 'INV-0003', 3, 3, '2026-09-10', 45000, 2500, 8100, 50600, 'confirmed', '2026-09-25'),
      (4, 'INV-0004', 1, 4, '2026-09-15', 18000, 500, 3240, 20740, 'confirmed', '2026-09-30'),
      (5, 'INV-0005', 1, 1, '2026-10-01', 25000, 0, 4500, 29500, 'confirmed', '2026-10-15'),
      (6, 'INV-0006', 2, 2, '2026-10-05', 12000, 500, 2160, 13660, 'confirmed', '2026-10-20'),
      (7, 'INV-0007', 3, 5, '2026-10-10', 80000, 5000, 14400, 89400, 'confirmed', '2026-11-10'),
      (8, 'INV-0008', 3, 3, '2026-10-15', 45000, 0, 8100, 53100, 'draft', '2026-11-15');

      INSERT INTO payments (id, invoice_id, amount, payment_method, transaction_id, payment_date, status, notes) VALUES
      (1, 1, 29500, 'Bank Transfer', 'TXN-902184-HDFC', '2026-09-08 14:30:00', 'Successful', 'Full payment via NEFT'),
      (2, 2, 13160, 'Card', 'TXN-482019-STRIPE', '2026-09-12 10:15:00', 'Successful', 'Corporate Card ending 4242'),
      (3, 3, 20000, 'UPI', 'TXN-773910-GPAY', '2026-09-20 18:45:00', 'Successful', 'Part payment 1 of 2'),
      (4, 4, 20740, 'Card', 'TXN-912834-FAILED', '2026-09-29 09:20:00', 'Failed', 'Card declined'),
      (5, 5, 29500, 'Bank Transfer', 'TXN-381920-PENDING', '2026-10-14 16:00:00', 'Pending', 'Awaiting clearing'),
      (6, 6, 8000, 'UPI', 'TXN-554109-PAYTM', '2026-10-18 11:10:00', 'Successful', 'Advance payment'),
      (7, 7, 50000, 'Bank Transfer', 'TXN-881920-ICICI', '2026-10-25 15:00:00', 'Successful', 'First installment');
    `);
  }
}

const app = createApp({ db, authenticate, authorize, getDiscount });
const port = Number(process.env.PORT || 5000);

if (require.main === module) {
  app.listen(port, () => console.log(`[Team Server] Member 2 & 3 API listening on http://localhost:${port}/api`));
}

module.exports = { app, db };
