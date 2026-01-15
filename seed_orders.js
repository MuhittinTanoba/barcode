
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'orders.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database (just in case)
db.exec(\
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT,
    total REAL,
    paymentMethod TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
\);

const orders = [
  {
    items: JSON.stringify([{ name: 'Coca Cola', quantity: 2, price: 2.5 }]),
    total: 5.0,
    paymentMethod: 'cash',
    createdAt: new Date().toISOString()
  },
  {
    items: JSON.stringify([{ name: 'Coffee', quantity: 1, price: 3.0 }, { name: 'Muffin', quantity: 1, price: 2.5 }]),
    total: 5.5,
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    items: JSON.stringify([{ name: 'Tea', quantity: 3, price: 1.5 }]),
    total: 4.5,
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const insert = db.prepare('INSERT INTO orders (items, total, paymentMethod, createdAt) VALUES (@items, @total, @paymentMethod, @createdAt)');
const insertMany = db.transaction((orders) => {
  for (const order of orders) insert.run(order);
});

try {
  insertMany(orders);
  console.log('Sample orders inserted successfully.');
} catch (e) {
  console.error('Error inserting orders:', e);
}

