const express = require('express');
const router = express.Router();
const { db, calculateInvoiceMetrics, getTodayStr } = require('../db');

// GET /api/finance/dashboard - Real-time KPI values & chart data
router.get('/dashboard', (req, res) => {
  try {
    // 1. Calculate All Invoices Metrics
    const allInvoices = db.prepare('SELECT * FROM invoices').all();
    const invoiceMetrics = allInvoices.map(inv => calculateInvoiceMetrics(inv));

    const totalInvoiced = invoiceMetrics.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const outstandingBalance = invoiceMetrics.reduce((sum, inv) => sum + inv.remaining_balance, 0);
    const overdueInvoices = invoiceMetrics.filter(inv => inv.is_overdue === 1);
    const overdueBalance = overdueInvoices.reduce((sum, inv) => sum + inv.remaining_balance, 0);
    const overdueCount = overdueInvoices.length;

    // 2. Collected Revenue (Sum of successful payments)
    const collectedStmt = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM payments
      WHERE status = 'Successful'
    `);
    const collectedRow = collectedStmt.get();
    const collectedRevenue = Number(collectedRow.total);
    const successfulPaymentCount = Number(collectedRow.count);

    // 3. Collection Rate (%)
    const collectionRate = totalInvoiced > 0
      ? +((collectedRevenue / totalInvoiced) * 100).toFixed(1)
      : 0;

    // 4. Monthly Revenue Trend (Last 6 months)
    const monthlyTrendStmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', payment_date) as month,
        SUM(amount) as revenue,
        COUNT(*) as count
      FROM payments
      WHERE status = 'Successful'
      GROUP BY strftime('%Y-%m', payment_date)
      ORDER BY month ASC
    `);
    const monthlyTrend = monthlyTrendStmt.all();

    // 5. Payment Status Distribution
    const statusDistStmt = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments
      GROUP BY status
    `);
    const statusDistribution = statusDistStmt.all();

    // 6. Revenue by Payment Method (Successful payments)
    const methodStmt = db.prepare(`
      SELECT 
        payment_method,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as count
      FROM payments
      WHERE status = 'Successful'
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `);
    const revenueByMethod = methodStmt.all();

    // 7. Recent Transactions (last 6)
    const recentTxStmt = db.prepare(`
      SELECT 
        p.id,
        p.amount,
        p.payment_method,
        p.transaction_id,
        p.payment_date,
        p.status,
        i.invoice_number,
        c.name as customer_name,
        c.company as customer_company
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT 6
    `);
    const recentTransactions = recentTxStmt.all();

    res.json({
      success: true,
      data: {
        kpi: {
          collected_revenue: +collectedRevenue.toFixed(2),
          outstanding_balance: +outstandingBalance.toFixed(2),
          overdue_balance: +overdueBalance.toFixed(2),
          overdue_count: overdueCount,
          successful_payment_count: successfulPaymentCount,
          total_invoiced: +totalInvoiced.toFixed(2),
          collection_rate: collectionRate
        },
        charts: {
          monthly_trend: monthlyTrend,
          status_distribution: statusDistribution,
          revenue_by_method: revenueByMethod
        },
        recent_transactions: recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching finance dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/finance/revenue - Revenue aggregated by date or month
router.get('/revenue', (req, res) => {
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

    const whereSql = whereClauses.join(' AND ');

    const stmt = db.prepare(`
      SELECT 
        strftime('${format}', payment_date) as period,
        SUM(amount) as revenue,
        COUNT(*) as transaction_count
      FROM payments
      WHERE ${whereSql}
      GROUP BY strftime('${format}', payment_date)
      ORDER BY period ASC
    `);

    const data = stmt.all(...params);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching revenue aggregation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/finance/reports - Generate report datasets
router.get('/reports', (req, res) => {
  try {
    const { report_type = 'daily_revenue', start_date, end_date } = req.query;
    const today = getTodayStr();

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
      const totalTx = result.rows.reduce((sum, r) => sum + Number(r.payment_count), 0);
      result.summary = {
        total_revenue: +totalRev.toFixed(2),
        total_transactions: totalTx,
        average_per_day: result.rows.length ? +(totalRev / result.rows.length).toFixed(2) : 0
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
        total_revenue: +totalRev.toFixed(2),
        total_months: result.rows.length,
        average_monthly: result.rows.length ? +(totalRev / result.rows.length).toFixed(2) : 0
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
          i.invoice_number,
          c.name as customer_name,
          c.company as customer_company
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN customers c ON i.customer_id = c.id
        WHERE ${where.join(' AND ')}
        ORDER BY p.payment_date DESC
      `);
      result.rows = stmt.all(...params);

      const successfulAmount = result.rows
        .filter(r => r.status === 'Successful')
        .reduce((sum, r) => sum + Number(r.amount), 0);

      result.summary = {
        total_records: result.rows.length,
        total_collected: +successfulAmount.toFixed(2),
        successful_count: result.rows.filter(r => r.status === 'Successful').length,
        failed_count: result.rows.filter(r => r.status === 'Failed').length,
        pending_count: result.rows.filter(r => r.status === 'Pending').length
      };
    } else if (report_type === 'outstanding_invoices') {
      const allInvoices = db.prepare(`
        SELECT 
          i.*,
          c.name as customer_name,
          c.company as customer_company
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        ORDER BY i.due_date ASC
      `).all();

      const evaluated = allInvoices
        .map(inv => calculateInvoiceMetrics(inv))
        .filter(inv => inv.remaining_balance > 0);

      result.rows = evaluated.map(inv => ({
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        company: inv.customer_company,
        total_amount: inv.total_amount,
        amount_paid: inv.amount_paid,
        remaining_balance: inv.remaining_balance,
        due_date: inv.due_date,
        status: inv.calculated_status,
        is_overdue: inv.is_overdue ? 'Yes' : 'No'
      }));

      const totalOutstanding = evaluated.reduce((sum, r) => sum + r.remaining_balance, 0);
      result.summary = {
        total_invoices: evaluated.length,
        total_outstanding_amount: +totalOutstanding.toFixed(2),
        overdue_count: evaluated.filter(r => r.is_overdue === 1).length
      };
    } else if (report_type === 'overdue_invoices') {
      const allInvoices = db.prepare(`
        SELECT 
          i.*,
          c.name as customer_name,
          c.company as customer_company
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        ORDER BY i.due_date ASC
      `).all();

      const overdue = allInvoices
        .map(inv => calculateInvoiceMetrics(inv))
        .filter(inv => inv.is_overdue === 1);

      result.rows = overdue.map(inv => ({
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        company: inv.customer_company,
        total_amount: inv.total_amount,
        amount_paid: inv.amount_paid,
        overdue_balance: inv.remaining_balance,
        due_date: inv.due_date,
        status: 'Overdue'
      }));

      const totalOverdue = overdue.reduce((sum, r) => sum + r.remaining_balance, 0);
      result.summary = {
        total_overdue_invoices: overdue.length,
        total_overdue_amount: +totalOverdue.toFixed(2)
      };
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

