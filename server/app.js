const express = require('express');
const cors = require('cors');
const { initDb, seedDb } = require('./db');

const paymentRoutes = require('./routes/payments');
const invoiceRoutes = require('./routes/invoices');
const financeRoutes = require('./routes/finance');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize DB schema & seed sample records if not already populated
initDb();
seedDb(false);

// API Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/finance', financeRoutes);

// System & Health Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    module: 'Member 3 - Payment Management & Finance Module',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/reset-seed', (req, res) => {
  seedDb(true);
  res.json({ success: true, message: 'Database reset to initial seed state.' });
});

// Serve frontend static build if available
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

module.exports = app;
