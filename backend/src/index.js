const express = require('express');
const cors = require('cors');
const { createMember2Router } = require('./member2');
const { createMember3Router } = require('./member3');

function createApp({ db, authenticate, authorize, getDiscount }) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ ok: true, modules: ['member2', 'member3'] }));
  app.use('/api', createMember2Router({ db, authenticate, authorize, getDiscount }));
  app.use('/api', createMember3Router({ db, authenticate, authorize }));
  return app;
}

module.exports = { createApp };
