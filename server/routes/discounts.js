const express = require('express');
const db = require('../db');
const {authenticate, requireRole} = require('../middleware/auth');
const {validateDiscount} = require('../services/discount');
const router = express.Router();

// Validate discount code
router.post('/validate', authenticate, (req, res) => {
  const {code, subtotal, quantity, productIds, date} = req.body;
  if (!code || subtotal == null || quantity == null) {
    return res.status(400).json({error: 'Missing fields'});
  }
  const result = validateDiscount({code, subtotal, quantity, productIds: productIds || [], date});
  res.json(result);
});

// List discounts (admin and staff)
router.get('/', authenticate, requireRole('admin','staff'), (req, res) => {
  const discounts = db.prepare('SELECT * FROM discounts').all();
  res.json({discounts});
});

// Create discount (admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const {code, type, value, min_amount = 0, min_quantity = 0, start_date, end_date, usage_limit, product_id} = req.body;
  if (!code || !type || value == null) return res.status(400).json({error: 'Missing required fields'});
  const upperCode = code.toUpperCase();
  if (type !== 'percentage' && type !== 'fixed') return res.status(400).json({error: 'Invalid type'});
  if (type === 'percentage' && (value < 0 || value > 100)) return res.status(400).json({error: 'Invalid percentage'});
  if (value < 0) return res.status(400).json({error: 'Invalid value'});
  const stmt = db.prepare('INSERT INTO discounts (code, type, value, min_amount, min_quantity, start_date, end_date, usage_limit, product_id) VALUES (?,?,?,?,?,?,?,?,?)');
  const info = stmt.run(upperCode, type, value, min_amount, min_quantity, start_date, end_date, usage_limit, product_id);
  const discount = db.prepare('SELECT * FROM discounts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({discount});
});

// Update discount (admin only)
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {code, type, value, min_amount, min_quantity, start_date, end_date, usage_limit, product_id, is_active} = req.body;
  const fields = [];
  const params = [];
  if (code) {fields.push('code = ?'); params.push(code.toUpperCase());}
  if (type) {if (type !== 'percentage' && type !== 'fixed') return res.status(400).json({error: 'Invalid type'}); fields.push('type = ?'); params.push(type);}
  if (value != null) {fields.push('value = ?'); params.push(value);}
  if (min_amount != null) {fields.push('min_amount = ?'); params.push(min_amount);}
  if (min_quantity != null) {fields.push('min_quantity = ?'); params.push(min_quantity);}
  if (start_date) {fields.push('start_date = ?'); params.push(start_date);}
  if (end_date) {fields.push('end_date = ?'); params.push(end_date);}
  if (usage_limit != null) {fields.push('usage_limit = ?'); params.push(usage_limit);}
  if (product_id != null) {fields.push('product_id = ?'); params.push(product_id);}
  if (is_active != null) {fields.push('is_active = ?'); params.push(is_active);}
  if (fields.length === 0) return res.status(400).json({error: 'Nothing to update'});
  params.push(id);
  const stmt = db.prepare(`UPDATE discounts SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  const discount = db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);
  res.json({discount});
});

// Activate / deactivate discount (admin only)
router.patch('/:id/active', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {is_active} = req.body;
  if (typeof is_active !== 'number') return res.status(400).json({error: 'is_active must be 0 or 1'});
  db.prepare('UPDATE discounts SET is_active = ? WHERE id = ?').run(is_active, id);
  const discount = db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);
  res.json({discount});
});

module.exports = router;

