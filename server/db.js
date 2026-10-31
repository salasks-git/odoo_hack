const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'finance.db');
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      company TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      status TEXT NOT NULL,
      start_date DATE NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      subscription_id INTEGER,
      subtotal DECIMAL(12, 2) NOT NULL,
      tax_amount DECIMAL(12, 2) DEFAULT 0.00,
      discount_amount DECIMAL(12, 2) DEFAULT 0.00,
      total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Card')),
      transaction_id TEXT UNIQUE,
      payment_date DATETIME NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Successful', 'Pending', 'Failed', 'Refunded')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);
  `);
}

function getTodayStr() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function calculateInvoiceMetrics(invoice) {
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total_paid
    FROM payments
    WHERE invoice_id = ? AND status = 'Successful'
  `);
  const row = stmt.get(invoice.id);
  const amountPaid = Number(row?.total_paid || 0);
  const totalAmount = Number(invoice.total_amount);
  const remainingBalance = Math.max(0, +(totalAmount - amountPaid).toFixed(2));
  
  const today = getTodayStr();
  const isPastDue = invoice.due_date < today;
  const isOverdue = isPastDue && remainingBalance > 0;

  let calculatedStatus = 'Unpaid';
  if (amountPaid >= totalAmount) {
    calculatedStatus = 'Paid';
  } else if (amountPaid > 0 && remainingBalance > 0) {
    calculatedStatus = isOverdue ? 'Overdue' : 'Partially Paid';
  } else if (isOverdue) {
    calculatedStatus = 'Overdue';
  } else {
    calculatedStatus = 'Unpaid';
  }

  return {
    ...invoice,
    amount_paid: amountPaid,
    remaining_balance: remainingBalance,
    is_overdue: isOverdue ? 1 : 0,
    calculated_status: calculatedStatus
  };
}

function syncInvoiceStatus(invoiceId) {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  if (!inv) return;
  const metrics = calculateInvoiceMetrics(inv);
  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(metrics.calculated_status, invoiceId);
}

function syncAllInvoiceStatuses() {
  const invoices = db.prepare('SELECT * FROM invoices').all();
  for (const inv of invoices) {
    const metrics = calculateInvoiceMetrics(inv);
    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(metrics.calculated_status, inv.id);
  }
}

function seedDb(force = false) {
  initDb();
  const customerCount = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
  if (customerCount > 0 && !force) {
    syncAllInvoiceStatuses();
    return;
  }

  db.exec('DELETE FROM payments;');
  db.exec('DELETE FROM invoices;');
  db.exec('DELETE FROM subscriptions;');
  db.exec('DELETE FROM customers;');

  // Insert Customers (Member 1 contract)
  db.exec(`
    INSERT INTO customers (id, name, email, phone, company) VALUES
    (1, 'Aarav Patel', 'aarav.patel@techinnovators.com', '+91 98765 43210', 'Tech Innovators Pvt Ltd'),
    (2, 'Sarah Jenkins', 's.jenkins@cloudnexus.io', '+1 415 555 2671', 'CloudNexus Inc'),
    (3, 'Vikram Malhotra', 'vikram@malhotramedia.in', '+91 91234 56789', 'Malhotra Media & Ent'),
    (4, 'Elena Rostova', 'elena@nordicdata.se', '+46 8 123 4567', 'Nordic Data Labs'),
    (5, 'Devon Vance', 'devon@vancelogistics.com', '+1 312 555 8920', 'Vance Logistics Corp');
  `);

  // Insert Subscriptions (Member 1 contract)
  db.exec(`
    INSERT INTO subscriptions (id, customer_id, plan_name, billing_cycle, status, start_date) VALUES
    (1, 1, 'Enterprise Scale Plan', 'Monthly', 'Active', '2026-01-01'),
    (2, 2, 'Pro Developer Plan', 'Monthly', 'Active', '2026-02-15'),
    (3, 3, 'Media Studio Ultimate', 'Quarterly', 'Active', '2026-01-10'),
    (4, 4, 'Data Analytics Tier 2', 'Monthly', 'Active', '2026-03-01'),
    (5, 5, 'Fleet Management Pro', 'Annual', 'Active', '2026-01-01');
  `);

  // Insert Invoices (Member 2 contract)
  // Current date in scenario is late Oct 2026
  db.exec(`
    INSERT INTO invoices (id, invoice_number, customer_id, subscription_id, subtotal, tax_amount, discount_amount, total_amount, issue_date, due_date, status) VALUES
    (1, 'INV-2026-001', 1, 1, 25000.00, 4500.00, 0.00, 29500.00, '2026-09-01', '2026-09-15', 'Paid'),
    (2, 'INV-2026-002', 2, 2, 12000.00, 2160.00, 1000.00, 13160.00, '2026-09-05', '2026-09-20', 'Paid'),
    (3, 'INV-2026-003', 3, 3, 45000.00, 8100.00, 2500.00, 50600.00, '2026-09-10', '2026-09-25', 'Overdue'),
    (4, 'INV-2026-004', 4, 4, 18000.00, 3240.00, 500.00, 20740.00, '2026-09-15', '2026-09-30', 'Overdue'),
    (5, 'INV-2026-005', 1, 1, 25000.00, 4500.00, 0.00, 29500.00, '2026-10-01', '2026-10-15', 'Overdue'),
    (6, 'INV-2026-006', 2, 2, 12000.00, 2160.00, 500.00, 13660.00, '2026-10-05', '2026-10-20', 'Partially Paid'),
    (7, 'INV-2026-007', 5, 5, 80000.00, 14400.00, 5000.00, 89400.00, '2026-10-10', '2026-11-10', 'Partially Paid'),
    (8, 'INV-2026-008', 3, 3, 45000.00, 8100.00, 0.00, 53100.00, '2026-10-15', '2026-11-15', 'Unpaid'),
    (9, 'INV-2026-009', 4, 4, 18000.00, 3240.00, 0.00, 21240.00, '2026-10-20', '2026-11-20', 'Unpaid'),
    (10, 'INV-2026-010', 1, 1, 25000.00, 4500.00, 1500.00, 28000.00, '2026-10-25', '2026-11-25', 'Unpaid');
  `);

  // Insert Payments (Member 3 core records)
  db.exec(`
    INSERT INTO payments (id, invoice_id, amount, payment_method, transaction_id, payment_date, status, notes) VALUES
    -- Invoice 1: Fully Paid (29500)
    (1, 1, 29500.00, 'Bank Transfer', 'TXN-902184-HDFC', '2026-09-08 14:30:00', 'Successful', 'Full payment via NEFT'),
    
    -- Invoice 2: Fully Paid (13160)
    (2, 2, 13160.00, 'Card', 'TXN-482019-STRIPE', '2026-09-12 10:15:00', 'Successful', 'Corporate Visa Card ending in 4242'),
    
    -- Invoice 3: Overdue, partial payment made (total 50600, paid 20000, balance 30600, due 2026-09-25)
    (3, 3, 20000.00, 'UPI', 'TXN-773910-GPAY', '2026-09-20 18:45:00', 'Successful', 'Part payment 1 of 2'),
    
    -- Invoice 4: Overdue, completely unpaid (balance 20740, due 2026-09-30) - 1 failed attempt recorded!
    (4, 4, 20740.00, 'Card', 'TXN-912834-FAILED', '2026-09-29 09:20:00', 'Failed', 'Card expired / insufficient funds'),

    -- Invoice 5: Overdue (balance 29500, due 2026-10-15) - 1 pending attempt recorded!
    (5, 5, 29500.00, 'Bank Transfer', 'TXN-381920-PENDING', '2026-10-14 16:00:00', 'Pending', 'Awaiting RTGS settlement'),

    -- Invoice 6: Partially Paid (total 13660, paid 8000, balance 5660, due 2026-10-20 -> overdue!)
    (6, 6, 8000.00, 'UPI', 'TXN-554109-PAYTM', '2026-10-18 11:10:00', 'Successful', 'Advance partial settlement'),

    -- Invoice 7: Partially Paid (total 89400, paid 50000, balance 39400, due 2026-11-10 -> future, not overdue!)
    (7, 7, 50000.00, 'Bank Transfer', 'TXN-881920-ICICI', '2026-10-15 15:00:00', 'Successful', 'First installment for annual fleet plan'),

    -- Historical Refund record test: customer overpaid or refunded transaction
    (8, 2, 1000.00, 'Card', 'TXN-REFUND-001', '2026-09-22 12:00:00', 'Refunded', 'Promotional credit refund processed');
  `);

  syncAllInvoiceStatuses();
}

module.exports = {
  db,
  initDb,
  seedDb,
  getTodayStr,
  calculateInvoiceMetrics,
  syncInvoiceStatus,
  syncAllInvoiceStatuses
};

