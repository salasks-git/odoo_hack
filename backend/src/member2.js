const express = require('express');

const NEXT_STATUS = { draft: 'quotation', quotation: 'confirmed', confirmed: 'active', active: 'closed' };
const money = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const cents = n => Math.round(Number(n) * 100);
const fromCents = n => Math.round(n) / 100;
const todayString = () => new Date().toISOString().slice(0, 10);
const error = (status, message) => Object.assign(new Error(message), { status });
const isOwnerOrStaff = (req, customerId) => ['admin', 'staff'].includes(req.user?.role) || Number(req.user?.id) === Number(customerId);

function addPeriod(dateString, period) {
  const date = new Date(`${dateString}T12:00:00Z`);
  const originalDay = date.getUTCDate();
  if (period === 'daily') date.setUTCDate(originalDay + 1);
  else if (period === 'weekly') date.setUTCDate(originalDay + 7);
  else if (period === 'monthly') { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1); date.setUTCDate(Math.min(originalDay, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate())); }
  else if (period === 'yearly') { date.setUTCFullYear(date.getUTCFullYear() + 1); }
  else throw error(400, `Unsupported plan period: ${period}`);
  return date.toISOString().slice(0, 10);
}

function createMember2Router({ db, authenticate = (_req, _res, next) => next(error(500, 'Authentication middleware is not connected')), authorize = () => (_req, _res, next) => next(), getDiscount = async () => null }) {
  if (!db) throw new Error('Member 2 router requires the shared database connection');
  const router = express.Router();
  router.use(authenticate);
  const adminOrStaff = authorize(['admin', 'staff']);
  const adminOnly = authorize('admin');

  const loadSubscription = id => db.prepare(`SELECT s.*, p.name AS plan_name, p.price AS plan_price, p.period AS plan_period, p.min_qty AS plan_min_qty, p.end_date AS plan_end_date, p.auto_close AS plan_auto_close FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.id=?`).get(id);
  const linesFor = id => db.prepare(`SELECT sl.*, pr.name AS product_name, v.value AS variant_name FROM subscription_lines sl JOIN products pr ON pr.id=sl.product_id LEFT JOIN variants v ON v.id=sl.variant_id WHERE sl.subscription_id=? ORDER BY sl.id`).all(id);
  const canView = (req, row) => { if (!row) throw error(404, 'Record not found'); if (!isOwnerOrStaff(req, row.customer_id)) throw error(403, 'You can only view your own records'); };
  const nextNumber = (table, prefix) => {
    const row = db.prepare(`SELECT number FROM ${table} ORDER BY id DESC LIMIT 1`).get();
    const n = row ? Number(row.number.replace(prefix, '')) + 1 : 1;
    return `${prefix}${String(n).padStart(4, '0')}`;
  };
  const readLines = input => {
    if (!Array.isArray(input) || input.length === 0) throw error(400, 'Add at least one subscription line');
    return input.map((line, index) => {
      const product = db.prepare('SELECT id, name, sales_price FROM products WHERE id=?').get(Number(line.product_id));
      if (!product) throw error(400, `Line ${index + 1}: product was not found`);
      let variant = null;
      if (line.variant_id != null) {
        variant = db.prepare('SELECT id, product_id, value, extra_price FROM variants WHERE id=?').get(Number(line.variant_id));
        if (!variant || Number(variant.product_id) !== Number(product.id)) throw error(400, `Line ${index + 1}: variant does not belong to this product`);
      }
      const qty = Number(line.qty);
      const unit = line.unit_price == null ? Number(product.sales_price) + Number(variant?.extra_price || 0) : Number(line.unit_price);
      const tax = Number(line.tax_percent ?? 0);
      if (!(qty > 0) || !Number.isFinite(qty) || !(unit >= 0) || !Number.isFinite(unit) || !(tax >= 0) || !Number.isFinite(tax)) throw error(400, `Line ${index + 1}: quantity, price or tax is invalid`);
      return { product_id: product.id, variant_id: variant?.id || null, qty, unit_price: money(unit), tax_percent: tax, line_subtotal: money(qty * unit) };
    });
  };
  const replaceLines = (id, lines) => {
    db.prepare('DELETE FROM subscription_lines WHERE subscription_id=?').run(id);
    const insert = db.prepare('INSERT INTO subscription_lines(subscription_id,product_id,variant_id,qty,unit_price,tax_percent,line_subtotal) VALUES(?,?,?,?,?,?,?)');
    lines.forEach(l => insert.run(id, l.product_id, l.variant_id, l.qty, l.unit_price, l.tax_percent, l.line_subtotal));
  };

  router.get('/subscriptions/mine', (req, res, next) => {
    try { const rows = db.prepare('SELECT * FROM subscriptions WHERE customer_id=? ORDER BY id DESC').all(req.user.id); res.json(rows); } catch (e) { next(e); }
  });
  router.get('/subscriptions', adminOrStaff, (req, res, next) => {
    try { const rows = db.prepare('SELECT * FROM subscriptions ORDER BY id DESC').all(); res.json(rows); } catch (e) { next(e); }
  });
  router.post('/subscriptions', adminOrStaff, (req, res, next) => {
    try {
      const body = req.body || {};
      const plan = db.prepare('SELECT * FROM plans WHERE id=?').get(Number(body.plan_id));
      if (!plan) throw error(400, 'Choose a valid plan');
      const lines = readLines(body.lines);
      const qty = lines.reduce((sum, line) => sum + line.qty, 0);
      if (qty < Number(plan.min_qty || 0)) throw error(400, `This plan requires a minimum total quantity of ${plan.min_qty}`);
      if (!body.start_date) throw error(400, 'start_date is required in YYYY-MM-DD format');
      const create = db.transaction(() => {
        const number = nextNumber('subscriptions', 'SUB-');
        const result = db.prepare(`INSERT INTO subscriptions(number,customer_id,plan_id,start_date,expiry_date,payment_terms,status,next_billing_date) VALUES(?,?,?,?,?,?,'draft',?)`).run(number, Number(body.customer_id), plan.id, body.start_date, body.expiry_date || plan.end_date || null, Number(body.payment_terms || 0), body.start_date);
        replaceLines(result.lastInsertRowid, lines);
        return result.lastInsertRowid;
      });
      const id = create(); res.status(201).json({ ...loadSubscription(id), lines: linesFor(id) });
    } catch (e) { next(e); }
  });
  router.get('/subscriptions/:id', (req, res, next) => {
    try { const row = loadSubscription(req.params.id); canView(req, row); res.json({ ...row, lines: linesFor(row.id) }); } catch (e) { next(e); }
  });
  router.patch('/subscriptions/:id', adminOrStaff, (req, res, next) => {
    try {
      const current = loadSubscription(req.params.id);
      if (!current) throw error(404, 'Subscription not found');
      if (!['draft', 'quotation'].includes(current.status)) throw error(409, 'Only draft or quotation subscriptions can be edited');
      const body = req.body || {};
      const plan = db.prepare('SELECT * FROM plans WHERE id=?').get(Number(body.plan_id ?? current.plan_id));
      if (!plan) throw error(400, 'Choose a valid plan');
      const lines = readLines(body.lines ?? linesFor(current.id));
      const qty = lines.reduce((sum, line) => sum + line.qty, 0);
      if (qty < Number(plan.min_qty || 0)) throw error(400, `This plan requires a minimum total quantity of ${plan.min_qty}`);
      const save = db.transaction(() => {
        db.prepare(`UPDATE subscriptions SET customer_id=?,plan_id=?,start_date=?,expiry_date=?,payment_terms=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(Number(body.customer_id ?? current.customer_id), plan.id, body.start_date ?? current.start_date, body.expiry_date ?? current.expiry_date, Number(body.payment_terms ?? current.payment_terms), current.id);
        replaceLines(current.id, lines);
      });
      save(); res.json({ ...loadSubscription(current.id), lines: linesFor(current.id) });
    } catch (e) { next(e); }
  });
  router.delete('/subscriptions/:id', adminOrStaff, (req, res, next) => {
    try {
      const row = loadSubscription(req.params.id);
      if (!row) throw error(404, 'Subscription not found');
      if (!['draft', 'quotation'].includes(row.status)) throw error(409, 'Only draft or quotation subscriptions can be deleted');
      db.prepare('DELETE FROM subscriptions WHERE id=?').run(row.id);
      res.status(204).end();
    } catch (e) { next(e); }
  });
  router.post('/subscriptions/:id/status', adminOrStaff, (req, res, next) => {
    try {
      const row = loadSubscription(req.params.id); if (!row) throw error(404, 'Subscription not found');
      if (req.body?.status !== NEXT_STATUS[row.status]) throw error(409, `Invalid status change. Next allowed status is ${NEXT_STATUS[row.status] || 'none'}`);
      const move = db.transaction(() => {
        if (req.body.status === 'active') {
          const lines = linesFor(row.id); const totalQty = lines.reduce((sum, l) => sum + Number(l.qty), 0);
          if (totalQty < Number(row.plan_min_qty || 0)) throw error(400, `This plan requires a minimum total quantity of ${row.plan_min_qty}`);
          db.prepare('UPDATE subscriptions SET status=?,next_billing_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status, row.start_date > todayString() ? row.start_date : todayString(), row.id);
        } else db.prepare('UPDATE subscriptions SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status, row.id);
      });
      move(); res.json(loadSubscription(row.id));
    } catch (e) { next(e); }
  });

  router.post('/billing/run', adminOrStaff, async (req, res, next) => {
    try {
      const today = req.body?.today || todayString();
      const active = db.prepare(`SELECT s.id FROM subscriptions s WHERE s.status='active' AND s.next_billing_date<=? ORDER BY s.id`).all(today);
      const expired = db.prepare(`SELECT s.id FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.status IN ('confirmed','active') AND p.auto_close=1 AND s.expiry_date IS NOT NULL AND s.expiry_date<?`).all(today);
      let created = 0, skipped = 0, closed = 0; const failures = [];
      for (const { id } of expired) { const r = db.prepare("UPDATE subscriptions SET status='closed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('confirmed','active')").run(id); closed += r.changes; }
      for (const { id } of active) {
        try {
          const result = db.transaction(() => {
            const sub = loadSubscription(id);
            if (!sub || sub.status !== 'active' || sub.next_billing_date > today) return 'skipped';
            const existing = db.prepare('SELECT id FROM invoices WHERE subscription_id=? AND period_start=?').get(id, sub.next_billing_date);
            if (existing) return 'skipped';
            const lines = linesFor(id);
            const discountResult = getDiscount(sub, lines, today);
            const subtotalCents = lines.reduce((sum, l) => sum + cents(Number(l.qty) * Number(l.unit_price)), 0);
            let discountCents = 0;
            if (discountResult) discountCents = discountResult.type === 'percent' ? Math.round(subtotalCents * Number(discountResult.value) / 100) : cents(discountResult.value);
            discountCents = Math.min(Math.max(0, discountCents), subtotalCents);
            const lineSubCents = lines.map(l => cents(Number(l.qty) * Number(l.unit_price)));
            let allocated = 0;
            const invLines = lines.map((l, i) => {
              const lineDiscount = i === lines.length - 1 ? discountCents - allocated : Math.round(discountCents * lineSubCents[i] / Math.max(1, subtotalCents));
              allocated += lineDiscount;
              const net = Math.max(0, lineSubCents[i] - lineDiscount);
              const tax = Math.round(net * Number(l.tax_percent) / 100);
              return { ...l, product_name: l.product_name, variant_name: l.variant_name, line_subtotal: fromCents(lineSubCents[i]), discount_amount: fromCents(lineDiscount), tax_amount: fromCents(tax), line_total: fromCents(net + tax) };
            });
            const taxCents = invLines.reduce((sum, l) => sum + cents(l.tax_amount), 0);
            const number = nextNumber('invoices', 'INV-');
            const terms = Math.max(0, Number(sub.payment_terms || 0)); const due = new Date(`${today}T12:00:00Z`); due.setUTCDate(due.getUTCDate() + terms);
            const inv = db.prepare(`INSERT INTO invoices(number,subscription_id,customer_id,period_start,subtotal,discount,tax,total,status,due_date) VALUES(?,?,?,?,?,?,?,?,'draft',?)`).run(number,id,sub.customer_id,sub.next_billing_date,fromCents(subtotalCents),fromCents(discountCents),fromCents(taxCents),fromCents(subtotalCents-discountCents+taxCents),due.toISOString().slice(0,10));
            const addLine = db.prepare(`INSERT INTO invoice_lines(invoice_id,product_id,variant_id,product_name,variant_name,qty,unit_price,tax_percent,line_subtotal,discount_amount,tax_amount,line_total) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
            invLines.forEach(l => addLine.run(inv.lastInsertRowid,l.product_id,l.variant_id,l.product_name,l.variant_name,l.qty,l.unit_price,l.tax_percent,l.line_subtotal,l.discount_amount,l.tax_amount,l.line_total));
            if (discountResult?.id) db.prepare('UPDATE discounts SET times_used=times_used+1 WHERE id=?').run(discountResult.id);
            db.prepare('UPDATE subscriptions SET next_billing_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(addPeriod(sub.next_billing_date,sub.plan_period),id);
            return 'created';
          })();
          if (result === 'created') created++; else skipped++;
        } catch (e) { if (String(e.code || '').includes('CONSTRAINT_UNIQUE')) skipped++; else failures.push({ subscription_id: id, message: e.message }); }
      }
      res.json({ today, processed: active.length, created, skipped, auto_closed: closed, failures });
    } catch (e) { next(e); }
  });

  router.get('/invoices/mine', (req, res, next) => {
    try { res.json(db.prepare('SELECT * FROM invoices WHERE customer_id=? ORDER BY id DESC').all(req.user.id)); } catch (e) { next(e); }
  });
  router.get('/invoices', adminOrStaff, (req, res, next) => {
    try { res.json(db.prepare('SELECT * FROM invoices ORDER BY id DESC').all()); } catch (e) { next(e); }
  });
  router.get('/invoices/:id', (req, res, next) => {
    try { const invoice = db.prepare('SELECT * FROM invoices WHERE id=?').get(req.params.id); canView(req, invoice); const lines = db.prepare('SELECT * FROM invoice_lines WHERE invoice_id=? ORDER BY id').all(invoice.id); res.json({ ...invoice, lines }); } catch (e) { next(e); }
  });
  for (const [action, status] of [['confirm', 'confirmed'], ['cancel', 'cancelled']]) {
    router.post(`/invoices/:id/${action}`, adminOnly, (req, res, next) => {
      try {
        const invoice = db.prepare('SELECT * FROM invoices WHERE id=?').get(req.params.id); if (!invoice) throw error(404, 'Invoice not found');
        if (invoice.status !== 'draft' && !(action === 'cancel' && invoice.status === 'confirmed')) throw error(409, `A ${invoice.status} invoice cannot be ${action}ed`);
        db.prepare('UPDATE invoices SET status=? WHERE id=?').run(status, invoice.id); res.json(db.prepare('SELECT * FROM invoices WHERE id=?').get(invoice.id));
      } catch (e) { next(e); }
    });
  }
  router.use((err, _req, res, _next) => { res.status(err.status || 500).json({ error: err.message || 'Unexpected server error' }); });
  return router;
}

module.exports = { createMember2Router, addPeriod };
