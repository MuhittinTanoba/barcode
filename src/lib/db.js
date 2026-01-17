import fs from 'fs';
import path from 'path';

// Helper to get the path to the orders.json file
// Uses USER_DATA_PATH in production to ensure write access
const getFilePath = () => {
  const dir = process.env.USER_DATA_PATH
    ? process.env.USER_DATA_PATH
    : path.join(process.cwd(), 'data');

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return path.join(dir, 'orders.json');
};

// Read all orders
const readOrders = () => {
  try {
    const filePath = getFilePath();
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
};

// Write all orders
const writeOrders = (orders) => {
  try {
    const filePath = getFilePath();
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing orders:', error);
    throw error;
  }
};

const db = {
  getAll: () => {
    // Return sorted by date desc
    return readOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById: (id) => {
    // loose comparison for string/number id
    return readOrders().find(o => o.id == id);
  },

  create: (item) => {
    const orders = readOrders();
    // Simulate Auto Increment ID using timestamp + random or just max id
    // Max ID logic:
    const maxId = orders.reduce((max, o) => (o.id > max ? o.id : max), 0);
    const newId = maxId + 1;

    const newOrder = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString() // JSON storage usually uses ISO string for dates
    };

    orders.push(newOrder);
    writeOrders(orders);
    return { lastInsertRowid: newId, ...newOrder };
  },

  update: (id, updates) => {
    const orders = readOrders();
    const index = orders.findIndex(o => o.id == id);

    if (index === -1) return null;

    orders[index] = { ...orders[index], ...updates };
    writeOrders(orders);
    return orders[index];
  },

  delete: (id) => {
    const orders = readOrders();
    const initialLength = orders.length;
    const filteredOrders = orders.filter(o => o.id != id);

    if (filteredOrders.length !== initialLength) {
      writeOrders(filteredOrders);
      return { changes: 1 };
    }
    return { changes: 0 };
  }
};

export default db;
