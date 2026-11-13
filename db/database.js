const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../gamezone.db');

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[-] Could not connect to SQLite database:', err.message);
  } else {
    console.log('[+] Connected to SQLite database at:', DB_PATH);
  }
});

// Enable SQLite Foreign Key Constraints
db.run('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error('[-] Failed to enable foreign keys:', err.message);
  }
});

// Promisified helper methods for clean async/await queries
const all = (sql, params = []) => {
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

// Initialize schema tables
const initDatabase = async () => {
  // Table 1: gamers
  await run(`
    CREATE TABLE IF NOT EXISTS gamers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 2: consoles
  await run(`
    CREATE TABLE IF NOT EXISTS consoles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    )
  `);

  // Table 3: bookings
  await run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gamer_id INTEGER NOT NULL,
      console_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gamer_id) REFERENCES gamers(id) ON DELETE CASCADE,
      FOREIGN KEY (console_id) REFERENCES consoles(id) ON DELETE CASCADE
    )
  `);

  console.log('[+] Database tables (gamers, consoles, bookings) initialized.');
};

module.exports = {
  db,
  all,
  get,
  run,
  initDatabase,
  DB_PATH
};
