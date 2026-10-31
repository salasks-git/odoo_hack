const express = require('express');
const db = require('../db');
const {authenticate, requireRole} = require('../middleware/auth');
const router = express.Router();

// Get variant by id (any authenticated user)
router.get('/:id', authenticate, (req, res) => {
  const {id} = req.params;
  const variant = db.prepare('SELECT * FROM variants WHERE id = ?').get(id);
  if (!variant) return res.status(404).json({error: 'Variant not found'});
  res.json({variant});
});

// Create variant for a product (admin only)
router.post('/product/:productId', authenticate, requireRole('admin'), (req, res) => {
  const {productId} = req.params;
  const {name, description, specs, extra_price = 0} = req.body;
  if (!name) return res.status(400).json({error: 'Missing name'});
  if (extra_price < 0) return res.status(400).json({error: 'extra_price cannot be negative'});
  const stmt = db.prepare('INSERT INTO variants (product_id, name, description, specs, extra_price) VALUES (?,?,?,?,?)');
  const info = stmt.run(productId, name, description, specs, extra_price);
  const variant = db.prepare('SELECT * FROM variants WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({variant});
});

// Update variant (admin only)
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {name, description, specs, extra_price, is_active} = req.body;
  const fields = [];
  const params = [];
  if (name) {fields.push('name = ?'); params.push(name);} 
  if (description) {fields.push('description = ?'); params.push(description);} 
  if (specs) {fields.push('specs = ?'); params.push(specs);} 
  if (extra_price != null) {if (extra_price < 0) return res.status(400).json({error: 'extra_price cannot be negative'}); fields.push('extra_price = ?'); params.push(extra_price);} 
  if (is_active != null) {fields.push('is_active = ?'); params.push(is_active);} 
  if (fields.length === 0) return res.status(400).json({error: 'Nothing to update'});
  params.push(id);
  const stmt = db.prepare(`UPDATE variants SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  const variant = db.prepare('SELECT * FROM variants WHERE id = ?').get(id);
  res.json({variant});
});

// Activate / deactivate variant
router.patch('/:id/active', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {is_active} = req.body;
  if (typeof is_active !== 'number') return res.status(400).json({error: 'is_active must be 0 or 1'});
  db.prepare('UPDATE variants SET is_active = ? WHERE id = ?').run(is_active, id);
  const variant = db.prepare('SELECT * FROM variants WHERE id = ?').get(id);
  res.json({variant});
});

module.exports = router;

