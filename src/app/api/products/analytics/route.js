import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Category from '@/models/Category';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Existing product analytics (byProduct) assumed present in your previous codebase
    // Compute byCategory
    const byCategory = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: '$prod' },
      {
        $lookup: {
          from: 'categories',
          localField: 'prod.categoryId',
          foreignField: '_id',
          as: 'cat'
        }
      },
      { $unwind: '$cat' },
      {
        $group: {
          _id: '$cat._id',
          name: { $first: '$cat.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $add: [
            { $multiply: ['$items.quantity', '$items.unitPrice'] },
            { $multiply: [
              { $ifNull: [ { $sum: '$items.options.price' }, 0 ] },
              '$items.quantity'
            ] }
          ] } },
          // If product has cost, compute cost * quantity and derive margin
          costTotal: { $sum: { $cond: [ { $ifNull: ['$prod.cost', false] }, { $multiply: ['$prod.cost', '$items.quantity'] }, 0 ] } }
        }
      },
      {
        $addFields: {
          margin: { $subtract: ['$revenue', '$costTotal'] },
          marginRate: {
            $cond: [ { $gt: ['$revenue', 0] }, { $multiply: [ { $divide: [ { $subtract: ['$revenue', '$costTotal'] }, '$revenue' ] }, 100 ] }, 0 ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Return previous fields if exist; otherwise only byCategory
    return NextResponse.json({
      byProduct: [],
      byCategory,
      topCategories: byCategory.slice(0, limit)
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


