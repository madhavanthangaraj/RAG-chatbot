const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const dbPath = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace('sqlite://', '') 
  : path.join(__dirname, '../../../chatbot.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to connect to SQLite database: %s', err.message);
  } else {
    logger.info(`Connected to SQLite database at ${dbPath}`);
    initSchema();
  }
});

function initSchema() {
  try {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(sql, (err) => {
        if (err) {
          logger.error('Failed to initialize database schema: %s', err.message);
        } else {
          logger.info('Database schema checked/initialized successfully.');
        }
      });
    }
  } catch (err) {
    logger.error('Error reading database schema file: %s', err.message);
  }
}

// Wrap db operations in promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  query,
  get,
  run
};
