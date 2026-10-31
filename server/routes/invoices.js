const express = require('express');
const router = express.Router();
const { db, calculateInvoiceMetrics, getTodayStr } = require('../db');

// GET /api/invoices - List invoices with calculated balance & overdue status
router.get('/', (req, res) => {
  try {
    const { status, customer_id, search } = req.query;

    let whereClauses = ['1=1'];
    const params = [];

    if (customer_id) {
      whereClauses.push('i.customer_id = ?');
      params.push(customer_id);
    }

    if (search && search.trim()) {
      whereClauses.push('(i.invoice_number LIKE ? OR c.name LIKE ? OR c.company LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.join(' AND ');

    const stmt = db.prepare(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company,
        s.plan_name,
        s.billing_cycle
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      WHERE ${whereSql}
      ORDER BY i.due_date ASC, i.id DESC
    `);

    const rawInvoices = stmt.all(...params);

    // Calculate balances and overdue indicators dynamically
    let calculated = rawInvoices.map(inv => calculateInvoiceMetrics(inv));

    // Filter by status if requested
    if (status && status !== 'all') {
      if (status === 'Overdue') {
        calculated = calculated.filter(inv => inv.is_overdue === 1);
      } else {
        calculated = calculated.filter(inv => inv.calculated_status === status);
      }
    }

    res.json({
      success: true,
      data: calculated,
      total: calculated.length
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices/overdue - List invoices with overdue balances
router.get('/overdue', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company,
        s.plan_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      ORDER BY i.due_date ASC
    `);

    const allInvoices = stmt.all();
    const overdueInvoices = allInvoices
      .map(inv => calculateInvoiceMetrics(inv))
      .filter(inv => inv.is_overdue === 1);

    const totalOverdueBalance = overdueInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0);

    res.json({
      success: true,
      data: overdueInvoices,
      count: overdueInvoices.length,
      total_overdue_balance: +totalOverdueBalance.toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices/:id - Single invoice with payment history
router.get('/:id', (req, res) => {
  try {
    const invoiceId = req.params.id;
    const stmt = db.prepare(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        s.plan_name,
        s.billing_cycle
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      WHERE i.id = ?
    `);

    const inv = stmt.get(invoiceId);
    if (!inv) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const metrics = calculateInvoiceMetrics(inv);

    const payments = db.prepare(`
      SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC
    `).all(invoiceId);

    res.json({
      success: true,
      data: {
        ...metrics,
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

