import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance = null;

export default function getDb() {
  if (dbInstance) return dbInstance;

  try {
    const dbPath = process.env.USER_DATA_PATH
      ? path.join(process.env.USER_DATA_PATH, 'orders.db')
      : path.join(process.cwd(), 'data', 'orders.db');

    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new Database(dbPath, { verbose: console.log });

    // Initialize database
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        items TEXT,
        total REAL,
        paymentMethod TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return dbInstance;
  } catch (error) {
    console.error('Database initialization failed:', error);
    try {
      const logPath = process.env.USER_DATA_PATH
        ? path.join(process.env.USER_DATA_PATH, 'db-error.log')
        : path.join(process.cwd(), 'db-error.log');
      fs.writeFileSync(logPath, `DB Error: ${error.message}\n${error.stack}`);
    } catch (_) { }
    throw error;
  }
}
