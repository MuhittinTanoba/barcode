import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params; // await params in Next.js 15
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Parse items if stored as JSON string
    return NextResponse.json({
      ...order,
      items: order.items ? JSON.parse(order.items) : [],
      _id: order.id // Compat
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const db = getDb();

    // Check if order exists
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const updates = [];
    const values = [];

    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.total !== undefined) {
      updates.push('total = ?');
      values.push(body.total);
    }
    // Add other fields as necessary based on schema in db.js (not fully visible here but assumed from orders/route.js)

    if (updates.length > 0) {
      const sql = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...values, id);
    }

    return NextResponse.json({ message: 'Order updated', id, ...body });

  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();
    const info = db.prepare('DELETE FROM orders WHERE id = ?').run(id);

    if (info.changes > 0) {
      return NextResponse.json({ message: 'Order deleted successfully' });
    }

    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
