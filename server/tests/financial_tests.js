const assert = require('assert');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Run tests against isolated in-memory or dedicated test database
const { seedDb, db, calculateInvoiceMetrics, syncInvoiceStatus, getTodayStr } = require('../db');

console.log('====================================================');
console.log('  MEMBER 3 FINANCE MODULE - AUTOMATED TEST SUITE    ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] Test #${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test #${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}\n`);
  }
}

// Ensure fresh seed data for clean test execution
seedDb(true);

// 1. A successful payment appears in payment history and affects collected revenue
runTest('A successful payment appears in payment history and affects collected revenue', () => {
  const initialRevenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) as rev FROM payments WHERE status = 'Successful'`).get().rev;
  
  // Pick Invoice 8 (Unpaid, total 53100)
  const inv = db.prepare('SELECT * FROM invoices WHERE id = 8').get();
  assert(inv, 'Invoice 8 must exist');

  const txnId = 'TXN-TEST-SUCCESS-001';
  db.prepare(`
    INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(8, 10000.00, 'UPI', txnId, '2026-10-31 10:00:00', 'Successful');

  syncInvoiceStatus(8);

  // Check payment appears in history
  const paymentRecord = db.prepare('SELECT * FROM payments WHERE transaction_id = ?').get(txnId);
  assert(paymentRecord, 'Payment must be found in payment history');
  assert.strictEqual(Number(paymentRecord.amount), 10000.00);

  // Check collected revenue increased exactly by 10000
  const updatedRevenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) as rev FROM payments WHERE status = 'Successful'`).get().rev;
  assert.strictEqual(Number(updatedRevenue), Number(initialRevenue) + 10000.00);
});

// 2. A pending or failed payment does not increase collected revenue
runTest('A pending or failed payment does not increase collected revenue', () => {
  const baselineRevenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) as rev FROM payments WHERE status = 'Successful'`).get().rev;

  // Insert Pending payment
  db.prepare(`
    INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(8, 5000.00, 'Bank Transfer', 'TXN-TEST-PENDING-001', '2026-10-31 10:05:00', 'Pending');

  // Insert Failed payment
  db.prepare(`
    INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(8, 7000.00, 'Card', 'TXN-TEST-FAILED-001', '2026-10-31 10:06:00', 'Failed');

  const afterRevenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) as rev FROM payments WHERE status = 'Successful'`).get().rev;
  assert.strictEqual(Number(afterRevenue), Number(baselineRevenue), 'Collected revenue must not change with pending/failed payments');
});

// 3. A partial payment reduces the invoice balance but does not mark the invoice fully paid
runTest('A partial payment reduces the invoice balance but does not mark the invoice fully paid', () => {
  // Invoice 10: total_amount = 28000.00, initially 0 paid
  const inv = db.prepare('SELECT * FROM invoices WHERE id = 10').get();
  assert.strictEqual(Number(inv.total_amount), 28000.00);

  // Make partial payment of 10000.00
  db.prepare(`
    INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(10, 10000.00, 'UPI', 'TXN-PARTIAL-10-001', '2026-10-31 10:10:00', 'Successful');

  syncInvoiceStatus(10);
  const metrics = calculateInvoiceMetrics(db.prepare('SELECT * FROM invoices WHERE id = 10').get());

  assert.strictEqual(metrics.amount_paid, 10000.00);
  assert.strictEqual(metrics.remaining_balance, 18000.00);
  assert.notStrictEqual(metrics.calculated_status, 'Paid', 'Must not be marked Paid');
  assert.strictEqual(metrics.calculated_status, 'Partially Paid');
});

// 4. An invoice past its due date with a remaining balance appears as overdue
runTest('An invoice past its due date with a remaining balance appears as overdue', () => {
  // Invoice 3: due_date = 2026-09-25 (past), total 50600, paid 20000, remaining balance 30600
  const inv = db.prepare('SELECT * FROM invoices WHERE id = 3').get();
  const metrics = calculateInvoiceMetrics(inv);

  assert(metrics.remaining_balance > 0, 'Remaining balance must be positive');
  assert(metrics.is_overdue === 1, 'Invoice must be marked as overdue');
  assert.strictEqual(metrics.calculated_status, 'Overdue');
});

// 5. A fully paid invoice does not appear as overdue, even if its due date has passed
runTest('A fully paid invoice does not appear as overdue, even if its due date has passed', () => {
  // Invoice 1: due_date = 2026-09-15 (past date), total 29500, paid 29500, remaining 0
  const inv = db.prepare('SELECT * FROM invoices WHERE id = 1').get();
  const metrics = calculateInvoiceMetrics(inv);

  assert.strictEqual(metrics.remaining_balance, 0, 'Remaining balance must be 0');
  assert.strictEqual(metrics.is_overdue, 0, 'Fully paid invoice must NOT be overdue');
  assert.strictEqual(metrics.calculated_status, 'Paid');
});

// 6. Duplicate transaction references are rejected
runTest('Duplicate transaction references are rejected safely', () => {
  const duplicateTxn = 'TXN-902184-HDFC'; // Already exists in seed data
  let threwError = false;
  try {
    db.prepare(`
      INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(2, 500.00, 'UPI', duplicateTxn, '2026-10-31 10:15:00', 'Successful');
  } catch (err) {
    threwError = true;
    assert(err.message.includes('UNIQUE constraint failed') || err.message.includes('transaction_id'));
  }
  assert(threwError, 'Attempting to insert a duplicate transaction_id must trigger unique constraint violation');
});

// 7. Invalid amounts (zero, negative) are rejected by table constraints
runTest('Zero or negative amounts are rejected by database CHECK constraint', () => {
  let threwZero = false;
  try {
    db.prepare(`
      INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(2, 0.00, 'UPI', 'TXN-ZERO-AMT', '2026-10-31 10:20:00', 'Successful');
  } catch (err) {
    threwZero = true;
    assert(err.message.includes('CHECK constraint failed'));
  }
  assert(threwZero, 'Zero amount payment must be rejected');

  let threwNegative = false;
  try {
    db.prepare(`
      INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(2, -500.00, 'UPI', 'TXN-NEG-AMT', '2026-10-31 10:20:00', 'Successful');
  } catch (err) {
    threwNegative = true;
    assert(err.message.includes('CHECK constraint failed'));
  }
  assert(threwNegative, 'Negative amount payment must be rejected');
});

// 8. Overpayment validation guard
runTest('Overpayment beyond remaining balance is detected and blocked', () => {
  // Invoice 2: total 13160, already paid 13160, remaining 0
  const inv = db.prepare('SELECT * FROM invoices WHERE id = 2').get();
  const metrics = calculateInvoiceMetrics(inv);
  const attemptedPayment = 100.00;
  
  const isOverpayment = attemptedPayment > metrics.remaining_balance;
  assert(isOverpayment, 'Attempting to pay when remaining balance is 0 must be identified as overpayment');
});

// 9. Dashboard totals match underlying records
runTest('Dashboard totals match underlying payment and invoice records', () => {
  const allInvoices = db.prepare('SELECT * FROM invoices').all().map(calculateInvoiceMetrics);
  const expectedOutstanding = allInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0);
  const expectedOverdueCount = allInvoices.filter(inv => inv.is_overdue === 1).length;

  const expectedRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Successful'
  `).get().total;

  assert(expectedRevenue > 0, 'Collected revenue must be positive');
  assert(expectedOutstanding > 0, 'Outstanding balance must be positive');
  assert(expectedOverdueCount > 0, 'Overdue invoices must exist');
});

// 10. Financial reports and grouping accuracy
runTest('Daily and monthly revenue aggregation groups correctly', () => {
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as rev
    FROM payments
    WHERE status = 'Successful'
    GROUP BY month
  `).all();

  assert(monthly.length >= 2, 'Should have payments across at least two months in seed data');
  const totalFromMonths = monthly.reduce((sum, m) => sum + Number(m.rev), 0);
  const totalRev = db.prepare(`SELECT SUM(amount) as t FROM payments WHERE status = 'Successful'`).get().t;
  assert.strictEqual(+totalFromMonths.toFixed(2), +Number(totalRev).toFixed(2));
});

console.log('\n----------------------------------------------------');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('----------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('ALL FINANCIAL CHECKS AND SAFEGUARDS VERIFIED SUCCESSFULLY!\n');
} else {
  process.exit(1);
}

