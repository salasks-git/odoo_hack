const express = require('express');
const db = require('../db');
const {authenticate, requireRole} = require('../middleware/auth');
const router = express.Router();

// List users
router.get('/', authenticate, requireRole('admin','staff'), (req, res) => {
  const {search, role, page = 1, limit = 20} = req.query;
  const offset = (page - 1) * limit;
  let where = [];
  let params = [];
  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s);
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  // Staff can only see customers
  if (req.user.role === 'staff') {
    where.push('role = ?');
    params.push('customer');
  }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const users = db.prepare(`SELECT id, name, email, role, is_active, created_at FROM users ${whereClause} LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({users});
});

// Create user (admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const {name, email, password, role} = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({error: 'Missing fields'});
  if (!['admin','staff','customer'].includes(role)) return res.status(400).json({error: 'Invalid role'});
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({error: 'Email already exists'});
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)');
  const info = stmt.run(name, email, hash, role);
  const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({user});
});

// Update user (admin only)
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {name, email, role, password} = req.body;
  const fields = [];
  const params = [];
  if (name) {fields.push('name = ?'); params.push(name);}
  if (email) {fields.push('email = ?'); params.push(email);}
  if (role) {
    if (!['admin','staff','customer'].includes(role)) return res.status(400).json({error: 'Invalid role'});
    fields.push('role = ?'); params.push(role);
  }
  if (password) {const bcrypt = require('bcryptjs'); const hash = bcrypt.hashSync(password, 10); fields.push('password_hash = ?'); params.push(hash);}
  if (fields.length === 0) return res.status(400).json({error: 'Nothing to update'});
  params.push(id);
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(id);
  res.json({user});
});

// Activate / deactivate user
router.patch('/:id/active', authenticate, requireRole('admin'), (req, res) => {
  const {id} = req.params;
  const {is_active} = req.body;
  if (typeof is_active !== 'number') return res.status(400).json({error: 'is_active must be 0 or 1'});
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active, id);
  const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(id);
  res.json({user});
});

module.exports = router;

