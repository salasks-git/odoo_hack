const express = require('express');
const db = require('../db');
const {authenticate, requireRole} = require('../middleware/auth');
const router = express.Router();

// List plans (any authenticated user) with filters
router.get('/', authenticate, (req, res) => {
  const {product_id, billing_period, active = 1, page = 1, limit = 20} = req.query;
  const offset = (page - 1) * limit;
  let where = [];
  let params = [];
  if (product_id) {where.push('product_id = ?'); params.push(product_id);} 
  if (billing_period) {where.push('billing_period = ?'); params.push(billing_period);} 
  if (active !== undefined) {where.push('is_active = ?'); params.push(active);} 
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const plans = db.prepare(`SELECT * FROM plans ${whereClause} LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({plans});
});

// Create plan (admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const {name, product_id, variant_id = null, price, billing_period, min_quantity = 1, start_date, end_date, auto_close, closable, pausable, renewable} = req.body;
  if (!name || !product_id || price == null || !billing_period) return res.status(400).json({error: 'Missing required fields'});
  if (price <= 0) return res.status(400).json({error: 'Price must be > 0'});
  // Validate billing period
  const allowed = ['daily','weekly','monthly','quarterly','yearly'];
  if (!allowed.includes(billing_period)) return res.status(400).json({error: 'Invalid billing period'});
  // Ensure product exists
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(400).json({error: 'Product not found'});
  // If variant_id provided, ensure it belongs to product
  if (variant_id) {
    const variant = db.prepare('SELECT id FROM variants WHERE id = ? AND product_id = ?').get(variant_id, product_id);
    if (!variant) return res.status(400).json({error: 'Variant does not belong to product'});
  }
  const stmt = db.prepare(`INSERT INTO plans (name, product_id, variant_id, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const info = stmt.run(name, product_id, variant_id, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable);
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({plan});
});

// Update plan (admin only)
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {name, product_id, variant_id, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active} = req.body;
  const fields = [];
  const params = [];
  if (name) {fields.push('name = ?'); params.push(name);} 
  if (product_id) {fields.push('product_id = ?'); params.push(product_id);} 
  if (variant_id !== undefined) {fields.push('variant_id = ?'); params.push(variant_id);} 
  if (price != null) {if (price <= 0) return res.status(400).json({error: 'Price must be > 0'}); fields.push('price = ?'); params.push(price);} 
  if (billing_period) {const allowed = ['daily','weekly','monthly','quarterly','yearly']; if (!allowed.includes(billing_period)) return res.status(400).json({error: 'Invalid billing period'}); fields.push('billing_period = ?'); params.push(billing_period);} 
  if (min_quantity != null) {fields.push('min_quantity = ?'); params.push(min_quantity);} 
  if (start_date) {fields.push('start_date = ?'); params.push(start_date);} 
  if (end_date) {fields.push('end_date = ?'); params.push(end_date);} 
  if (auto_close != null) {fields.push('auto_close = ?'); params.push(auto_close);} 
  if (closable != null) {fields.push('closable = ?'); params.push(closable);} 
  if (pausable != null) {fields.push('pausable = ?'); params.push(pausable);} 
  if (renewable != null) {fields.push('renewable = ?'); params.push(renewable);} 
  if (is_active != null) {fields.push('is_active = ?'); params.push(is_active);} 
  if (fields.length === 0) return res.status(400).json({error: 'Nothing to update'});
  // Validate product and variant relationship if both provided
  if (product_id && variant_id) {
    const variant = db.prepare('SELECT id FROM variants WHERE id = ? AND product_id = ?').get(variant_id, product_id);
    if (!variant) return res.status(400).json({error: 'Variant does not belong to product'});
  }
  params.push(id);
  const stmt = db.prepare(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  res.json({plan});
});

// Activate / deactivate plan
router.patch('/:id/active', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {is_active} = req.body;
  if (typeof is_active !== 'number') return res.status(400).json({error: 'is_active must be 0 or 1'});
  db.prepare('UPDATE plans SET is_active = ? WHERE id = ?').run(is_active, id);
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  res.json({plan});
});

module.exports = router;

