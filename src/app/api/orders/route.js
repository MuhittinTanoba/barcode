import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET all orders
export async function GET() {
  try {
    const db = getDb();
    const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
    // Parse items JSON string back to object
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      _id: order.id // Maintain compatibility if frontend expects _id
    }));
    return NextResponse.json(parsedOrders);
  } catch (error) {
    return NextResponse.json({ message: error.message, stack: error.stack }, { status: 500 });
  }
}

// POST new order
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[API] Received order payload:', body);

    const db = getDb();
    const insert = db.prepare('INSERT INTO orders (items, total, paymentMethod) VALUES (?, ?, ?)');

    const itemsJson = JSON.stringify(body.items || []);
    const totalVal = (body.total !== undefined && body.total !== null) ? body.total : 0;
    const paymentMethodVal = body.paymentMethod || 'cash';

    const info = insert.run(
      itemsJson,
      totalVal,
      paymentMethodVal
    );

    return NextResponse.json({ id: info.lastInsertRowid, ...body }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: error.message, stack: error.stack, code: error.code }, { status: 500 }); // Changed status to 500 to catch startup errors
  }
}
