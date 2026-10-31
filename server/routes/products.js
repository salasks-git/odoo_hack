const express = require('express');
const db = require('../db');
const {authenticate, requireRole} = require('../middleware/auth');
const router = express.Router();

// List products (any authenticated user)
router.get('/', authenticate, (req, res) => {
  const {search, category, active = 1, page = 1, limit = 20} = req.query;
  const offset = (page - 1) * limit;
  let where = [];
  let params = [];
  if (search) {
    where.push('(name LIKE ? OR description LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s);
  }
  if (category) { where.push('category = ?'); params.push(category); }
  if (active !== undefined) { where.push('is_active = ?'); params.push(active); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const products = db.prepare(`SELECT id, name, type, category, description, sales_price, cost_price, notes, is_active, created_at FROM products ${whereClause} LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({products});
});

// Create product (admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const {name, type, category, description, sales_price, cost_price, notes} = req.body;
  if (!name || sales_price == null || cost_price == null) return res.status(400).json({error: 'Missing required fields'});
  if (sales_price <= 0 || cost_price <= 0) return res.status(400).json({error: 'Prices must be > 0'});
  const stmt = db.prepare('INSERT INTO products (name, type, category, description, sales_price, cost_price, notes) VALUES (?,?,?,?,?,?,?)');
  const info = stmt.run(name, type, category, description, sales_price, cost_price, notes);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({product});
});

// Update product (admin only)
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {name, type, category, description, sales_price, cost_price, notes, is_active} = req.body;
  const fields = [];
  const params = [];
  if (name) {fields.push('name = ?'); params.push(name);} 
  if (type) {fields.push('type = ?'); params.push(type);} 
  if (category) {fields.push('category = ?'); params.push(category);} 
  if (description) {fields.push('description = ?'); params.push(description);} 
  if (sales_price != null) {if (sales_price <= 0) return res.status(400).json({error: 'sales_price must be >0'}); fields.push('sales_price = ?'); params.push(sales_price);} 
  if (cost_price != null) {if (cost_price <= 0) return res.status(400).json({error: 'cost_price must be >0'}); fields.push('cost_price = ?'); params.push(cost_price);} 
  if (notes) {fields.push('notes = ?'); params.push(notes);} 
  if (is_active != null) {fields.push('is_active = ?'); params.push(is_active);} 
  if (fields.length === 0) return res.status(400).json({error: 'Nothing to update'});
  params.push(id);
  const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({product});
});

// Activate / deactivate product
router.patch('/:id/active', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {is_active} = req.body;
  if (typeof is_active !== 'number') return res.status(400).json({error: 'is_active must be 0 or 1'});
  db.prepare('UPDATE products SET is_active = ? WHERE id = ?').run(is_active, id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({product});
});

module.exports = router;

