const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const {generateToken} = require('../middleware/auth');
const router = express.Router();

// Register (customer only)
router.post('/register', (req, res) => {
  const {name, email, password} = req.body;
  if (!name || !email || !password) return res.status(400).json({error: 'Missing fields'});
  if (password.length < 9 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[!@#$%^&*]/.test(password)) {
    return res.status(400).json({error: 'Weak password'});
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({error: 'Email already exists'});
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)');
  const info = stmt.run(name, email, hash, 'customer');
  const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = generateToken(user);
  res.json({token, user});
});

// Login
router.post('/login', (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) return res.status(400).json({error: 'Missing fields'});
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.is_active) return res.status(401).json({error: 'Invalid credentials'});
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({error: 'Invalid credentials'});
  const token = generateToken(user);
  const {password_hash, reset_token, reset_expires, ...safe} = user;
  res.json({token, user: safe});
});

// Forgot password
router.post('/forgot-password', (req, res) => {
  const {email} = req.body;
  if (!email) return res.status(400).json({error: 'Missing email'});
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) return res.json({message: 'If email exists, a reset link will be sent'});
  const crypto = require('crypto');
  const token = crypto.randomBytes(20).toString('hex');
  const hash = bcrypt.hashSync(token, 10);
  const expires = Date.now() + 3600000; // 1h
  db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(hash, expires, user.id);
  console.log(`Password reset link: http://localhost:${process.env.PORT||5000}/reset-password/${token}`);
  res.json({message: 'If email exists, a reset link will be sent'});
});

// Reset password
router.post('/reset-password', (req, res) => {
  const {token, password} = req.body;
  if (!token || !password) return res.status(400).json({error: 'Missing fields'});
  const users = db.prepare('SELECT * FROM users WHERE reset_token IS NOT NULL').all();
  const user = users.find(u => bcrypt.compareSync(token, u.reset_token) && u.reset_expires > Date.now());
  if (!user) return res.status(400).json({error: 'Invalid or expired token'});
  if (password.length < 9 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[!@#$%^&*]/.test(password)) {
    return res.status(400).json({error: 'Weak password'});
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?').run(hash, user.id);
  res.json({message: 'Password reset successful'});
});

// Get own profile
router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({user});
});

// Update own profile (name, email)
router.put('/me', require('../middleware/auth').authenticate, (req, res) => {
  const {name, email} = req.body;
  if (!name && !email) return res.status(400).json({error: 'Nothing to update'});
  const fields = [];
  const params = [];
  if (name) {fields.push('name = ?'); params.push(name);} 
  if (email) {fields.push('email = ?'); params.push(email);} 
  params.push(req.user.id);
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  const updated = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({user: updated});
});

module.exports = router;

