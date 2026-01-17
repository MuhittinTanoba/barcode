import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const order = db.getById(id);

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Parse items if stored as JSON string (compat)
    return NextResponse.json({
      ...order,
      items: (typeof order.items === 'string') ? JSON.parse(order.items) : (order.items || []),
      _id: order.id
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedOrder = db.update(id, body);

    if (!updatedOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order updated', ...updatedOrder });

  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const info = db.delete(id);

    if (info.changes > 0) {
      return NextResponse.json({ message: 'Order deleted successfully' });
    }

    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
