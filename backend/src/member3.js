const express = require('express');

const money = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const todayString = () => new Date().toISOString().slice(0, 10);
const error = (status, message) => Object.assign(new Error(message), { status });

function calculateInvoiceMetrics(db, invoice) {
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total_paid
    FROM payments
    WHERE invoice_id = ? AND status = 'Successful'
  `).get(invoice.id);

  const amountPaid = money(row?.total_paid || 0);
  const totalAmount = money(invoice.total);
  const remainingBalance = Math.max(0, money(totalAmount - amountPaid));
  
  const today = todayString();
  const isPastDue = invoice.due_date < today;
  const isOverdue = isPastDue && remainingBalance > 0;

  // Compute days overdue
  let daysOverdue = 0;
  if (isOverdue) {
    const dueDateObj = new Date(invoice.due_date);
    const todayObj = new Date(today);
    const diffTime = todayObj - dueDateObj;
    daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

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
    days_overdue: daysOverdue,
    calculated_status: calculatedStatus
  };
}

function syncInvoiceStatus(db, invoiceId) {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  if (!inv) return;
  const metrics = calculateInvoiceMetrics(db, inv);
  // Update invoice status column in database
  const statusToSave = metrics.calculated_status === 'Paid' ? 'paid' : inv.status;
  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(statusToSave, invoiceId);
}

function createMember3Router({
  db,
  authenticate = (_req, _res, next) => next(),
  authorize = () => (_req, _res, next) => next()
}) {
  if (!db) throw new Error('Member 3 router requires the shared database connection');

  const router = express.Router();
  router.use(authenticate);

  // 1. GET /payments - List payments with filters & search
  router.get('/payments', (req, res, next) => {
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
          i.number LIKE ? OR 
          COALESCE(u.name, 'Customer') LIKE ? OR
          p.notes LIKE ?
        )`);
        const term = `%${search.trim()}%`;
        params.push(term, term, term, term);
      }

      const whereSql = whereClauses.join(' AND ');

      // Total count
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN users u ON i.customer_id = u.id
        WHERE ${whereSql}
      `);
      const total = countStmt.get(...params)?.total || 0;

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
          i.number as invoice_number,
          i.total as invoice_total,
          i.due_date as invoice_due_date,
          i.status as invoice_status,
          COALESCE(u.id, i.customer_id) as customer_id,
          COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name,
          COALESCE(u.email, 'customer' || i.customer_id || '@example.com') as customer_email
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN users u ON i.customer_id = u.id
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
    } catch (e) {
      next(e);
    }
  });

  // 2. GET /payments/:id - Single payment detail
  router.get('/payments/:id', (req, res, next) => {
    try {
      const payment = db.prepare(`
        SELECT 
          p.*,
          i.number as invoice_number,
          i.total as invoice_total,
          i.due_date as invoice_due_date,
          i.status as invoice_status,
          COALESCE(u.id, i.customer_id) as customer_id,
          COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name,
          COALESCE(u.email, 'customer' || i.customer_id || '@example.com') as customer_email
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN users u ON i.customer_id = u.id
        WHERE p.id = ?
      `).get(req.params.id);

      if (!payment) throw error(404, 'Payment record was not found');

      const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(payment.invoice_id);
      const invoiceMetrics = calculateInvoiceMetrics(db, inv);

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
    } catch (e) {
      next(e);
    }
  });

  // 3. POST /payments - Record a verified payment
  router.post('/payments', (req, res, next) => {
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

      if (!invoice_id) throw error(400, 'Invoice ID is required');

      const numericAmount = money(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw error(400, 'Payment amount must be greater than zero');
      }

      const validMethods = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
      if (!payment_method || !validMethods.includes(payment_method)) {
        throw error(400, `Invalid payment method. Allowed: ${validMethods.join(', ')}`);
      }

      const validStatuses = ['Successful', 'Pending', 'Failed', 'Refunded'];
      if (!status || !validStatuses.includes(status)) {
        throw error(400, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
      }

      const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
      if (!invoice) throw error(404, 'Invoice was not found');

      const currentMetrics = calculateInvoiceMetrics(db, invoice);

      // Overpayment guard
      if (status === 'Successful' && numericAmount > currentMetrics.remaining_balance + 0.001) {
        throw error(400, `Payment amount ($${numericAmount.toFixed(2)}) cannot exceed remaining invoice balance ($${currentMetrics.remaining_balance.toFixed(2)}). Overpayments are not supported.`);
      }

      // Unique transaction ID guard
      let cleanTxnId = transaction_id ? String(transaction_id).trim() : null;
      if (cleanTxnId) {
        const existingTxn = db.prepare('SELECT id FROM payments WHERE transaction_id = ?').get(cleanTxnId);
        if (existingTxn) {
          throw error(400, `Transaction reference '${cleanTxnId}' already exists (Payment #${existingTxn.id}). Duplicate transactions are prohibited.`);
        }
      } else {
        cleanTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const effectiveDate = payment_date || new Date().toISOString().replace('T', ' ').slice(0, 19);

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
      syncInvoiceStatus(db, invoice_id);

      const updatedMetrics = calculateInvoiceMetrics(db, db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id));

      const createdPayment = db.prepare(`
        SELECT p.*, i.number as invoice_number
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE p.id = ?
      `).get(newPaymentId);

      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: createdPayment,
        invoice: updatedMetrics
      });
    } catch (e) {
      next(e);
    }
  });

  // 4. GET /invoices/balances - List invoices with calculated balance & overdue status
  router.get('/invoices/balances', (req, res, next) => {
    try {
      const { status, customer_id, search } = req.query;

      let whereClauses = ['1=1'];
      const params = [];

      if (customer_id) {
        whereClauses.push('i.customer_id = ?');
        params.push(customer_id);
      }

      if (search && search.trim()) {
        whereClauses.push('(i.number LIKE ? OR COALESCE(u.name, "") LIKE ?)');
        const term = `%${search.trim()}%`;
        params.push(term, term);
      }

      const rawInvoices = db.prepare(`
        SELECT 
          i.*,
          i.number as invoice_number,
          i.total as total_amount,
          COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name,
          COALESCE(u.email, 'customer' || i.customer_id || '@example.com') as customer_email,
          s.number as subscription_number
        FROM invoices i
        LEFT JOIN users u ON i.customer_id = u.id
        LEFT JOIN subscriptions s ON i.subscription_id = s.id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY i.due_date ASC, i.id DESC
      `).all(...params);

      let calculated = rawInvoices.map(inv => calculateInvoiceMetrics(db, inv));

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
    } catch (e) {
      next(e);
    }
  });

  // 5. GET /invoices/overdue - Overdue invoices list
  router.get('/invoices/overdue', (req, res, next) => {
    try {
      const allInvoices = db.prepare(`
        SELECT 
          i.*,
          i.number as invoice_number,
          i.total as total_amount,
          COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name,
          COALESCE(u.email, 'customer' || i.customer_id || '@example.com') as customer_email,
          s.number as subscription_number
        FROM invoices i
        LEFT JOIN users u ON i.customer_id = u.id
        LEFT JOIN subscriptions s ON i.subscription_id = s.id
        ORDER BY i.due_date ASC
      `).all();

      const overdueInvoices = allInvoices
        .map(inv => calculateInvoiceMetrics(db, inv))
        .filter(inv => inv.is_overdue === 1);

      const totalOverdueBalance = money(overdueInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0));

      res.json({
        success: true,
        data: overdueInvoices,
        count: overdueInvoices.length,
        total_overdue_balance: totalOverdueBalance
      });
    } catch (e) {
      next(e);
    }
  });

  // 6. GET /finance/dashboard - High-level KPIs & charts data
  router.get('/finance/dashboard', (req, res, next) => {
    try {
      const allInvoices = db.prepare('SELECT * FROM invoices').all();
      const invoiceMetrics = allInvoices.map(inv => calculateInvoiceMetrics(db, inv));

      const totalInvoiced = money(invoiceMetrics.reduce((sum, inv) => sum + Number(inv.total), 0));
      const outstandingBalance = money(invoiceMetrics.reduce((sum, inv) => sum + inv.remaining_balance, 0));
      const overdueInvoices = invoiceMetrics.filter(inv => inv.is_overdue === 1);
      const overdueBalance = money(overdueInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0));
      const overdueCount = overdueInvoices.length;

      const collectedStmt = db.prepare(`
        SELECT 
          COALESCE(SUM(amount), 0) as total,
          COUNT(*) as count
        FROM payments
        WHERE status = 'Successful'
      `);
      const collectedRow = collectedStmt.get();
      const collectedRevenue = money(collectedRow?.total || 0);
      const successfulPaymentCount = Number(collectedRow?.count || 0);

      const collectionRate = totalInvoiced > 0
        ? +((collectedRevenue / totalInvoiced) * 100).toFixed(1)
        : 0;

      // Monthly Trend
      const monthlyTrend = db.prepare(`
        SELECT 
          strftime('%Y-%m', payment_date) as month,
          SUM(amount) as revenue,
          COUNT(*) as count
        FROM payments
        WHERE status = 'Successful'
        GROUP BY strftime('%Y-%m', payment_date)
        ORDER BY month ASC
      `).all();

      // Status Distribution
      const statusDistribution = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM payments
        GROUP BY status
      `).all();

      // Revenue by Method
      const revenueByMethod = db.prepare(`
        SELECT 
          payment_method,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as count
        FROM payments
        WHERE status = 'Successful'
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `).all();

      // Recent 5 Transactions
      const recentTransactions = db.prepare(`
        SELECT 
          p.id,
          p.amount,
          p.payment_method,
          p.transaction_id,
          p.payment_date,
          p.status,
          i.number as invoice_number,
          COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN users u ON i.customer_id = u.id
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT 5
      `).all();

      // Recent Overdue Invoices (up to 5)
      const recentOverdue = overdueInvoices.slice(0, 5);

      res.json({
        success: true,
        data: {
          kpi: {
            collected_revenue: collectedRevenue,
            outstanding_balance: outstandingBalance,
            overdue_balance: overdueBalance,
            overdue_count: overdueCount,
            successful_payment_count: successfulPaymentCount,
            total_invoiced: totalInvoiced,
            collection_rate: collectionRate
          },
          charts: {
            monthly_trend: monthlyTrend,
            status_distribution: statusDistribution,
            revenue_by_method: revenueByMethod
          },
          recent_transactions: recentTransactions,
          recent_overdue: recentOverdue
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // 7. GET /finance/revenue - Aggregated revenue
  router.get('/finance/revenue', (req, res, next) => {
    try {
      const { by = 'day', start_date, end_date } = req.query;
      const format = by === 'month' ? '%Y-%m' : '%Y-%m-%d';

      let whereClauses = ["status = 'Successful'"];
      const params = [];

      if (start_date) {
        whereClauses.push("date(payment_date) >= date(?)");
        params.push(start_date);
      }

      if (end_date) {
        whereClauses.push("date(payment_date) <= date(?)");
        params.push(end_date);
      }

      const stmt = db.prepare(`
        SELECT 
          strftime('${format}', payment_date) as period,
          SUM(amount) as revenue,
          COUNT(*) as transaction_count
        FROM payments
        WHERE ${whereClauses.join(' AND ')}
        GROUP BY strftime('${format}', payment_date)
        ORDER BY period ASC
      `);

      res.json({ success: true, data: stmt.all(...params) });
    } catch (e) {
      next(e);
    }
  });

  // 8. GET /finance/reports - Report datasets
  router.get('/finance/reports', (req, res, next) => {
    try {
      const { report_type = 'daily_revenue', start_date, end_date } = req.query;

      let result = {
        report_type,
        generated_at: new Date().toISOString(),
        summary: {},
        rows: []
      };

      if (report_type === 'daily_revenue') {
        let where = ["p.status = 'Successful'"];
        const params = [];
        if (start_date) { where.push("date(p.payment_date) >= date(?)"); params.push(start_date); }
        if (end_date) { where.push("date(p.payment_date) <= date(?)"); params.push(end_date); }

        const stmt = db.prepare(`
          SELECT 
            date(p.payment_date) as date,
            SUM(p.amount) as revenue,
            COUNT(*) as payment_count,
            SUM(CASE WHEN p.payment_method = 'UPI' THEN p.amount ELSE 0 END) as upi_revenue,
            SUM(CASE WHEN p.payment_method = 'Bank Transfer' THEN p.amount ELSE 0 END) as bank_revenue,
            SUM(CASE WHEN p.payment_method = 'Card' THEN p.amount ELSE 0 END) as card_revenue,
            SUM(CASE WHEN p.payment_method = 'Cash' THEN p.amount ELSE 0 END) as cash_revenue
          FROM payments p
          WHERE ${where.join(' AND ')}
          GROUP BY date(p.payment_date)
          ORDER BY date DESC
        `);
        result.rows = stmt.all(...params);

        const totalRev = result.rows.reduce((sum, r) => sum + Number(r.revenue), 0);
        result.summary = {
          total_revenue: money(totalRev),
          total_transactions: result.rows.reduce((sum, r) => sum + Number(r.payment_count), 0),
          average_per_day: result.rows.length ? money(totalRev / result.rows.length) : 0
        };
      } else if (report_type === 'monthly_revenue') {
        let where = ["p.status = 'Successful'"];
        const params = [];
        if (start_date) { where.push("date(p.payment_date) >= date(?)"); params.push(start_date); }
        if (end_date) { where.push("date(p.payment_date) <= date(?)"); params.push(end_date); }

        const stmt = db.prepare(`
          SELECT 
            strftime('%Y-%m', p.payment_date) as month,
            SUM(p.amount) as revenue,
            COUNT(*) as payment_count
          FROM payments p
          WHERE ${where.join(' AND ')}
          GROUP BY strftime('%Y-%m', p.payment_date)
          ORDER BY month DESC
        `);
        result.rows = stmt.all(...params);

        const totalRev = result.rows.reduce((sum, r) => sum + Number(r.revenue), 0);
        result.summary = {
          total_revenue: money(totalRev),
          total_months: result.rows.length,
          average_monthly: result.rows.length ? money(totalRev / result.rows.length) : 0
        };
      } else if (report_type === 'payment_history') {
        let where = ['1=1'];
        const params = [];
        if (start_date) { where.push("date(p.payment_date) >= date(?)"); params.push(start_date); }
        if (end_date) { where.push("date(p.payment_date) <= date(?)"); params.push(end_date); }

        const stmt = db.prepare(`
          SELECT 
            p.id,
            p.transaction_id,
            p.amount,
            p.payment_method,
            p.status,
            p.payment_date,
            p.notes,
            i.number as invoice_number,
            COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name
          FROM payments p
          JOIN invoices i ON p.invoice_id = i.id
          LEFT JOIN users u ON i.customer_id = u.id
          WHERE ${where.join(' AND ')}
          ORDER BY p.payment_date DESC
        `);
        result.rows = stmt.all(...params);

        const successfulAmount = result.rows
          .filter(r => r.status === 'Successful')
          .reduce((sum, r) => sum + Number(r.amount), 0);

        result.summary = {
          total_records: result.rows.length,
          total_collected: money(successfulAmount),
          successful_count: result.rows.filter(r => r.status === 'Successful').length,
          failed_count: result.rows.filter(r => r.status === 'Failed').length,
          pending_count: result.rows.filter(r => r.status === 'Pending').length
        };
      } else if (report_type === 'outstanding_invoices') {
        const allInvoices = db.prepare(`
          SELECT i.*, COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name
          FROM invoices i
          LEFT JOIN users u ON i.customer_id = u.id
          ORDER BY i.due_date ASC
        `).all();

        const evaluated = allInvoices
          .map(inv => calculateInvoiceMetrics(db, inv))
          .filter(inv => inv.remaining_balance > 0);

        result.rows = evaluated.map(inv => ({
          invoice_number: inv.number,
          customer_name: inv.customer_name,
          total_amount: inv.total,
          amount_paid: inv.amount_paid,
          remaining_balance: inv.remaining_balance,
          due_date: inv.due_date,
          status: inv.calculated_status,
          days_overdue: inv.days_overdue
        }));

        result.summary = {
          total_invoices: evaluated.length,
          total_outstanding_amount: money(evaluated.reduce((sum, r) => sum + r.remaining_balance, 0)),
          overdue_count: evaluated.filter(r => r.is_overdue === 1).length
        };
      } else if (report_type === 'overdue_invoices') {
        const allInvoices = db.prepare(`
          SELECT i.*, COALESCE(u.name, 'Customer #' || i.customer_id) as customer_name
          FROM invoices i
          LEFT JOIN users u ON i.customer_id = u.id
          ORDER BY i.due_date ASC
        `).all();

        const overdue = allInvoices
          .map(inv => calculateInvoiceMetrics(db, inv))
          .filter(inv => inv.is_overdue === 1);

        result.rows = overdue.map(inv => ({
          invoice_number: inv.number,
          customer_name: inv.customer_name,
          total_amount: inv.total,
          amount_paid: inv.amount_paid,
          overdue_balance: inv.remaining_balance,
          due_date: inv.due_date,
          days_overdue: inv.days_overdue,
          status: 'Overdue'
        }));

        result.summary = {
          total_overdue_invoices: overdue.length,
          total_overdue_amount: money(overdue.reduce((sum, r) => sum + r.remaining_balance, 0))
        };
      }

      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { createMember3Router, calculateInvoiceMetrics };
