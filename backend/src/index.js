const express = require('express');
const cors = require('cors');
const { createMember2Router } = require('./member2');

function createApp({ db, authenticate, authorize, getDiscount }) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ ok: true, module: 'member2' }));
  app.use('/api', createMember2Router({ db, authenticate, authorize, getDiscount }));
  return app;
}

module.exports = { createApp };
