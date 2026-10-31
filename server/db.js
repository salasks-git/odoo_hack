const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);
module.exports = db;
