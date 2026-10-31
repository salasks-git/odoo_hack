const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config({path: require('path').join(__dirname, '..', '.env')});

function generateToken(user) {
  return jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '8h'});
}
module.exports.generateToken = generateToken;

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({error: 'Missing token'});
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, role, is_active FROM users WHERE id = ?').get(payload.id);
    if (!user || !user.is_active) {
      return res.status(401).json({error: 'Invalid user'});
    }
    req.user = {id: user.id, role: user.role};
    next();
  } catch (err) {
    return res.status(401).json({error: 'Invalid token'});
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({error: 'Forbidden'});
    }
    next();
  };
}

module.exports = {authenticate, requireRole, generateToken};
