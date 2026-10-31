const bcrypt = require('bcryptjs');
const db = require('./db');

const hashAdmin = bcrypt.hashSync('Admin@1234', 10);
const hashUser = bcrypt.hashSync('User@1234', 10);

// Users (admin, staff, customer)
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password_hash, role)
  VALUES (?, ?, ?, ?)
`);
insertUser.run('Admin', 'admin@example.com', hashAdmin, 'admin');
insertUser.run('Staff Member', 'staff@example.com', hashUser, 'staff');
insertUser.run('Customer User', 'customer@example.com', hashUser, 'customer');

// Products
const insertProduct = db.prepare(`
  INSERT INTO products (name, type, category, description, sales_price, cost_price, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let p1 = db.prepare('SELECT id FROM products WHERE name = ?').get('Cloud Hosting');
if (!p1) {
  const info = insertProduct.run('Cloud Hosting', 'service', 'hosting', 'High performance VPS hosting', 100000, 50000, 'Cloud VPS');
  p1 = { id: info.lastInsertRowid };
}

let p2 = db.prepare('SELECT id FROM products WHERE name = ?').get('SaaS Analytics');
if (!p2) {
  const info = insertProduct.run('SaaS Analytics', 'service', 'software', 'Enterprise analytics platform', 200000, 80000, 'Analytics suite');
  p2 = { id: info.lastInsertRowid };
}

// Variants
const insertVariant = db.prepare(`
  INSERT INTO variants (product_id, name, description, specs, extra_price)
  VALUES (?, ?, ?, ?, ?)
`);

let v1 = db.prepare('SELECT id FROM variants WHERE product_id = ? AND name = ?').get(p1.id, 'Standard Node (4GB)');
if (!v1) {
  const info = insertVariant.run(p1.id, 'Standard Node (4GB)', '4GB RAM VPS', '{"ram": "4GB", "cpu": "2 vCPU"}', 0);
  v1 = { id: info.lastInsertRowid };
}

let v2 = db.prepare('SELECT id FROM variants WHERE product_id = ? AND name = ?').get(p1.id, 'Pro Node (8GB)');
if (!v2) {
  const info = insertVariant.run(p1.id, 'Pro Node (8GB)', '8GB RAM VPS', '{"ram": "8GB", "cpu": "4 vCPU"}', 50000);
  v2 = { id: info.lastInsertRowid };
}

let v3 = db.prepare('SELECT id FROM variants WHERE product_id = ? AND name = ?').get(p2.id, 'Standard Edition');
if (!v3) {
  const info = insertVariant.run(p2.id, 'Standard Edition', 'Up to 10 team seats', '{"seats": 10}', 0);
  v3 = { id: info.lastInsertRowid };
}

// Plans
const insertPlan = db.prepare(`
  INSERT INTO plans (name, product_id, variant_id, price, billing_period, min_quantity, auto_close, closable, pausable, renewable)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const existingPlans = db.prepare('SELECT count(*) as count FROM plans').get();
if (existingPlans.count === 0) {
  insertPlan.run('Monthly Cloud Basic', p1.id, v1.id, 100000, 'monthly', 1, 0, 1, 1, 1);
  insertPlan.run('Monthly Cloud Pro', p1.id, v2.id, 150000, 'monthly', 1, 0, 1, 1, 1);
  insertPlan.run('Yearly Analytics Standard', p2.id, v3.id, 2000000, 'yearly', 1, 0, 1, 1, 1);
}

// Discounts
const insertDiscount = db.prepare(`
  INSERT OR IGNORE INTO discounts (code, type, value, min_amount, min_quantity, usage_limit, product_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
insertDiscount.run('WELCOME10', 'percentage', 10, 50000, 1, 100, null);
insertDiscount.run('FLAT500', 'fixed', 50000, 100000, 1, 50, p1.id);

console.log('Seeding complete.');

