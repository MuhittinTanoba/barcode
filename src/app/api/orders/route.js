import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all orders
export async function GET() {
  try {
    const orders = db.getAll();
    // JSON storage already stores objects, but if we stored items as stringified JSON in legacy, 
    // we might need parsing. However, for new JSON implementation we can store objects directly.
    // BUT we need to support legacy SQL data if we were migrating. 
    // Since we are switching fresh, let's assume we store 'items' as object in create() below.
    // Wait, the previous SQL impl stringified items.

    // Let's keep consistency: if items is string, parse it. If object, leave it.
    const parsedOrders = orders.map(order => ({
      ...order,
      items: (typeof order.items === 'string') ? JSON.parse(order.items) : order.items,
      _id: order.id
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

    // In JSON db we can store items directly as array, no need to stringify unless we want strict compat.
    // Let's store as object to be modern.
    const newOrder = {
      items: body.items || [],
      total: (body.total !== undefined && body.total !== null) ? body.total : 0,
      paymentMethod: body.paymentMethod || 'cash',
      status: 'pending'
    };

    const info = db.create(newOrder);

    return NextResponse.json({ id: info.lastInsertRowid, ...body }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: error.message, stack: error.stack, code: error.code }, { status: 500 });
  }
}
