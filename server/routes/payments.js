const express = require('express');
const router = express.Router();
const { db, calculateInvoiceMetrics, syncInvoiceStatus } = require('../db');

// GET /api/payments - List payments with filters and search
router.get('/', (req, res) => {
  try {
    const { status, payment_method, invoice_id, start_date, end_date, search, page = 1, limit = 50 } = req.query;

    let whereClauses = ['1=1'];
    const params = [];

    if (status && status !== 'all') {
      whereClauses.push('p.status = ?');
      params.push(status);
    }

    if (payment_method && payment_method !== 'all') {
      whereClauses.push('p.payment_method = ?');
      params.push(payment_method);
    }

    if (invoice_id) {
      whereClauses.push('p.invoice_id = ?');
      params.push(invoice_id);
    }

    if (start_date) {
      whereClauses.push("date(p.payment_date) >= date(?)");
      params.push(start_date);
    }

    if (end_date) {
      whereClauses.push("date(p.payment_date) <= date(?)");
      params.push(end_date);
    }

    if (search && search.trim()) {
      whereClauses.push(`(
        p.transaction_id LIKE ? OR 
        i.invoice_number LIKE ? OR 
        c.name LIKE ? OR 
        c.company LIKE ? OR
        p.notes LIKE ?
      )`);
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE ${whereSql}
    `);
    const total = countStmt.get(...params).total;

    // Fetch page items
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (parsedPage - 1) * parsedLimit;

    const listStmt = db.prepare(`
      SELECT 
        p.id,
        p.invoice_id,
        p.amount,
        p.payment_method,
        p.transaction_id,
        p.payment_date,
        p.status,
        p.notes,
        p.created_at,
        i.invoice_number,
        i.total_amount as invoice_total,
        i.due_date as invoice_due_date,
        i.status as invoice_status,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE ${whereSql}
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT ? OFFSET ?
    `);

    const payments = listStmt.all(...params, parsedLimit, offset);

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/payments/:id - Single payment detail with invoice history
router.get('/:id', (req, res) => {
  try {
    const paymentId = req.params.id;
    const stmt = db.prepare(`
      SELECT 
        p.*,
        i.invoice_number,
        i.total_amount as invoice_total,
        i.due_date as invoice_due_date,
        i.status as invoice_status,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE p.id = ?
    `);
    const payment = stmt.get(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Invoice metrics
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(payment.invoice_id);
    const invoiceMetrics = calculateInvoiceMetrics(inv);

    // Other payments for same invoice
    const relatedPayments = db.prepare(`
      SELECT * FROM payments WHERE invoice_id = ? AND id != ? ORDER BY payment_date DESC
    `).all(payment.invoice_id, payment.id);

    res.json({
      success: true,
      data: {
        payment,
        invoice: invoiceMetrics,
        related_payments: relatedPayments
      }
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/payments - Record a payment with strict financial validation
router.post('/', (req, res) => {
  try {
    const {
      invoice_id,
      amount,
      payment_method,
      transaction_id,
      payment_date,
      status = 'Successful',
      notes = ''
    } = req.body;

    // 1. Validate required fields
    if (!invoice_id) {
      return res.status(400).json({ success: false, error: 'Invoice ID is required' });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount must be a positive number greater than zero'
      });
    }

    const validMethods = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment method. Allowed: ${validMethods.join(', ')}`
      });
    }

    const validStatuses = ['Successful', 'Pending', 'Failed', 'Refunded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${validStatuses.join(', ')}`
      });
    }

    // 2. Fetch invoice and verify existence
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Target invoice does not exist' });
    }

    const currentMetrics = calculateInvoiceMetrics(invoice);

    // 3. Safeguard: Prevent overpayment when recording Successful payment
    if (status === 'Successful') {
      const remaining = currentMetrics.remaining_balance;
      // Allow for precision tolerance of 0.01
      if (numericAmount > remaining + 0.001) {
        return res.status(400).json({
          success: false,
          error: `Payment amount (${numericAmount.toFixed(2)}) cannot exceed remaining invoice balance (${remaining.toFixed(2)}). Overpayments are not supported.`
        });
      }
    }

    // 4. Safeguard: Duplicate transaction ID check
    let cleanTxnId = transaction_id ? String(transaction_id).trim() : null;
    if (cleanTxnId) {
      const existingTxn = db.prepare('SELECT id FROM payments WHERE transaction_id = ?').get(cleanTxnId);
      if (existingTxn) {
        return res.status(400).json({
          success: false,
          error: `Transaction reference '${cleanTxnId}' has already been recorded (Payment #${existingTxn.id}). Duplicate transaction references are prohibited.`
        });
      }
    } else {
      // Auto-generate reference if not provided
      cleanTxnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    const effectiveDate = payment_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 5. Insert payment record
    const insertStmt = db.prepare(`
      INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, payment_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      invoice_id,
      numericAmount,
      payment_method,
      cleanTxnId,
      effectiveDate,
      status,
      notes || null
    );

    const newPaymentId = Number(result.lastInsertRowid);

    // 6. Update invoice status
    syncInvoiceStatus(invoice_id);
    const updatedMetrics = calculateInvoiceMetrics(db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id));

    const createdPayment = db.prepare(`
      SELECT 
        p.*,
        i.invoice_number,
        c.name as customer_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE p.id = ?
    `).get(newPaymentId);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: createdPayment,
      invoice: {
        id: invoice_id,
        invoice_number: updatedMetrics.invoice_number,
        total_amount: updatedMetrics.total_amount,
        amount_paid: updatedMetrics.amount_paid,
        remaining_balance: updatedMetrics.remaining_balance,
        status: updatedMetrics.calculated_status,
        is_overdue: updatedMetrics.is_overdue
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

