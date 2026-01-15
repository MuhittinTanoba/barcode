import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Category from '@/models/Category';

// GET /api/orders/analytics?from=&to=&groupBy=hour|day|month
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const groupBy = searchParams.get('groupBy') || 'day';

    const dateFilter = {};
    if (fromParam) {
      dateFilter.$gte = new Date(fromParam);
    }
    if (toParam) {
      dateFilter.$lte = new Date(toParam);
    }

    // Only include paid orders that are not cancelled
    const matchStage = {
      paymentStatus: 'paid',
      status: { $ne: 'cancelled' }
    };
    
    // Use paidAt if available for revenue timeline, otherwise createdAt
    if (fromParam || toParam) {
      matchStage.$or = [
        { paidAt: dateFilter },
        { paidAt: null, createdAt: dateFilter }
      ];
    }

    const timeFormat = groupBy === 'hour'
      ? { $dateToString: { format: '%Y-%m-%d %H:00', date: { $ifNull: ['$paidAt', '$createdAt'] } } }
      : groupBy === 'month'
        ? { $dateToString: { format: '%Y-%m', date: { $ifNull: ['$paidAt', '$createdAt'] } } }
        : { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$paidAt', '$createdAt'] } } };

    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' }
              }
            },
            { $project: { _id: 0 } }
          ],
          byTime: [
            { $group: { _id: timeFormat, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
            { $sort: { _id: 1 } }
          ],
          byPaymentMethod: [
            { $group: { _id: '$paymentMethod', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
            { $project: { paymentMethod: '$_id', orders: 1, revenue: 1, _id: 0 } },
            { $sort: { revenue: -1 } }
          ],
          byProduct: [
            { $unwind: '$items' },
            { $group: { _id: '$items.productId', name: { $first: '$items.name' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $add: [ { $multiply: ['$items.quantity', '$items.unitPrice'] }, { $multiply: ['$items.quantity', { $sum: '$items.options.price' }] } ] } } } },
            { $project: { productId: '$_id', name: 1, quantity: 1, revenue: 1, _id: 0 } },
            { $sort: { quantity: -1 } },
            { $limit: 20 }
          ],
          byCategory: [
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
            { $unwind: '$category' },
            { $group: { _id: '$category._id', name: { $first: '$category.name' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $add: [ { $multiply: ['$items.quantity', '$items.unitPrice'] }, { $multiply: ['$items.quantity', { $sum: '$items.options.price' }] } ] } } } },
            { $project: { categoryId: '$_id', name: 1, quantity: 1, revenue: 1, _id: 0 } },
            { $sort: { revenue: -1 } }
          ]
        }
      }
    ];

    const [result] = await Order.aggregate(pipeline);

    // Get cancelled and pending orders count from all orders (not just paid)
    const allOrdersMatch = {};
    if (fromParam || toParam) {
      allOrdersMatch.createdAt = dateFilter;
    }
    
    const [cancelledCountResult, pendingCountResult] = await Promise.all([
      Order.aggregate([
        { $match: { ...allOrdersMatch, status: 'cancelled' } },
        { $group: { _id: null, count: { $sum: 1 } } },
        { $project: { _id: 0 } }
      ]),
      Order.aggregate([
        { $match: { ...allOrdersMatch, status: 'pending' } },
        { $group: { _id: null, count: { $sum: 1 } } },
        { $project: { _id: 0 } }
      ])
    ]);
    
    const cancelledOrders = cancelledCountResult[0]?.count || 0;
    const pendingOrders = pendingCountResult[0]?.count || 0;

    const totals = result.totals[0] || { totalOrders: 0, totalRevenue: 0 };
    totals.paidOrders = totals.totalOrders; // All orders in result are paid (filtered by matchStage)
    totals.cancelledOrders = cancelledOrders;
    totals.pendingOrders = pendingOrders;
    const averageOrderValue = totals.totalOrders > 0 ? (totals.totalRevenue / totals.totalOrders) : 0;

    return NextResponse.json({
      totals: { ...totals, averageOrderValue },
      byTime: result.byTime,
      byPaymentMethod: result.byPaymentMethod,
      byProduct: result.byProduct,
      byCategory: result.byCategory
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


