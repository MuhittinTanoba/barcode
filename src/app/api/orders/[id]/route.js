import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Order from '@/models/Order';
import Table from '@/models/Table';
import Customer from '@/models/Customer';
import { calculatePointsEarned, updateCustomerStats, addPoints } from '@/services/pointsService';
import { applyCampaign, recordCampaignUsage } from '@/services/campaignService';

// GET single order
export async function GET(request,
  { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id)
      .populate('tableId', 'number name')
      .populate('items.productId', 'name');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT update order
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Capture previous payment status BEFORE applying incoming changes
    const wasUnpaid = order.paymentStatus === 'unpaid';

    // ---------------------------------------------------------
    // 1. COUPON HANDLING
    // ---------------------------------------------------------
    if (body.couponCode !== undefined) {
      if (body.couponCode === null) {
        // Remove coupon
        order.couponCode = null;
        order.couponDiscount = 0;
      } else {
        // Apply coupon (Assumes validation done by frontend or separate checking logic)
        // Here we just accept the code and discount amount trusted from frontend/validation
        order.couponCode = body.couponCode;
        if (body.couponDiscount !== undefined) {
          order.couponDiscount = body.couponDiscount;
        }
      }
    }

    // ---------------------------------------------------------
    // 2. PAYMENT HANDLING (Split & Full)
    // ---------------------------------------------------------
    // Check if this is a new payment being added
    if (body.addPayment) {
      const { method, amount, processedBy, items: paidItems } = body.addPayment;
      console.log('DEBUG: Adding payment with payload:', JSON.stringify(body.addPayment, null, 2));

      // Handle Split Item Payment Logic
      if (paidItems && Array.isArray(paidItems) && paidItems.length > 0) {
        paidItems.forEach(paidItem => {
          // Find matching item in order
          // We match by productId and options (if any)
          // Since items might not have _id, we use finding logic

          // Strategy: Find FIRST item that matches Product + Options AND has remaining quantity
          const targetItem = order.items.find(item => {
            const sameProduct = item.productId.toString() === paidItem.productId;

            // Compare options
            const itemOptions = item.options || [];
            const paidOptions = paidItem.options || [];

            // If options length differs, not same item
            if (itemOptions.length !== paidOptions.length) return false;

            // Deep compare options
            const sameOptions = itemOptions.every(opt =>
              paidOptions.some(pOpt => pOpt.name === opt.name && pOpt.price === opt.price)
            );

            // Primary Match: Product ID
            // Secondary Match: Item Name (if Product ID is missing/null/mismatched but seemingly same item)
            // We require Options to match in all cases.

            const isMatch = (sameProduct || (item.name === paidItem.name)) && sameOptions;

            if (!isMatch) return false;

            // Crucial: Check if this specific line item has enough unpaid quantity
            const currentPaid = item.paidQuantity || 0;
            const remaining = item.quantity - currentPaid;

            return remaining >= paidItem.quantity;
          });

          if (targetItem) {
            targetItem.paidQuantity = (targetItem.paidQuantity || 0) + paidItem.quantity;

            // Safety clamp
            if (targetItem.paidQuantity > targetItem.quantity) {
              targetItem.paidQuantity = targetItem.quantity;
            }
          } else {
            console.warn("Could not find eligible item for split payment:", paidItem);
            // Fallback: If exact match with enough quantity not found, try to fill partials? 
            // For now, let's stick to exact logic but log warning.
          }
        });

      }

      // Initialize payments array if needed
      if (!order.payments) order.payments = [];

      order.payments.push({
        method,
        amount,
        processedBy,
        transactionId: body.addPayment.transactionId,
        timestamp: new Date()
      });

      // Recalculate total paid
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      order.amountPaid = totalPaid; // Update the main amountPaid field

      // Calculate remaining
      const currentTotal = order.totalAmount;
      const remaining = Math.max(0, currentTotal - totalPaid);
      order.remainingAmount = remaining;

      // Update statuses
      if (remaining <= 0.01) { // Tolerance for float math
        order.status = 'paid';
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        // If it was split, keep 'split', otherwise use the last method
        if (order.payments.length > 1) {
          order.paymentMethod = 'split';
        } else {
          order.paymentMethod = method;
        }
      } else {
        order.status = 'partially_paid';
        order.paymentStatus = 'partially_paid';
        order.paymentMethod = 'split';
      }
    }
    // Legacy/Simple Payment Handling (Direct update override)
    else if (body.amountPaid !== undefined) {
      order.amountPaid = body.amountPaid;

      // If paymentStatus is explicitly set to paid
      if (body.paymentStatus === 'paid') {
        order.remainingAmount = 0;
        // If no payments recorded yet, create one for the full amount
        if ((!order.payments || order.payments.length === 0) && body.paymentMethod) {
          order.payments = [{
            method: body.paymentMethod,
            amount: order.amountPaid,
            timestamp: new Date()
          }];
        }
      }
    }

    // ---------------------------------------------------------
    // 3. GENERIC FIELD UPDATES
    // ---------------------------------------------------------
    const updateFields = ['items', 'status', 'paymentStatus', 'paymentMethod', 'tipAmount', 'change', 'totalAmount', 'description'];
    updateFields.forEach(field => {
      if (body[field] !== undefined) {
        // Don't overwrite calculated fields if we just did payment logic
        if (field === 'status' && body.addPayment) return;
        if (field === 'paymentStatus' && body.addPayment) return;

        order[field] = body[field];
      }
    });

    // Handle customer loyalty fields
    if (body.customerId !== undefined) {
      order.customerId = body.customerId;
    }
    if (body.pointsEarned !== undefined) {
      order.pointsEarned = body.pointsEarned;
    }
    if (body.campaignApplied !== undefined) {
      order.campaignApplied = body.campaignApplied;
    }
    if (body.discountAmount !== undefined) {
      order.discountAmount = body.discountAmount;
    }

    // ---------------------------------------------------------
    // 4. POST-PAYMENT LOGIC (Loyalty, Tables)
    // ---------------------------------------------------------

    const sideEffects = [];

    // CUSTOMER LOGIC
    if (order.paymentStatus === 'paid' && order.customerId && (!order.pointsEarned || order.pointsEarned === 0)) {
      const customerAfter = await Customer.findById(order.customerId);
      if (customerAfter) {
        const computedPoints = calculatePointsEarned(order.totalAmount, customerAfter);
        console.log(`Customer ${customerAfter._id} attached to paid order ${order._id}, computed points: ${computedPoints}`);

        if (computedPoints > 0) {
          order.pointsEarned = computedPoints;
        }

        // Parallelize Customer DB Updates
        sideEffects.push((async () => {
          if (computedPoints > 0) {
            await addPoints(order.customerId, computedPoints, order._id, `Points earned from order #${order._id}`);
          }
          // Always update customer stats
          console.log(`Updating customer stats for ${customerAfter._id} with order amount: ${order.totalAmount}`);
          await updateCustomerStats(order.customerId, order.totalAmount, 0);
        })());
      }
    }

    // TABLE LOGIC
    // Handle table transition when Paid or Cancelled
    // Logic: If it became paid (from unpaid/partial) OR it is cancelled
    const shouldFreeTable = (order.status === 'paid' && (wasUnpaid || order.status === 'partially_paid')) || order.status === 'cancelled';

    if (shouldFreeTable && order.tableId) {
      sideEffects.push(
        Table.findByIdAndUpdate(order.tableId, { status: 'available', currentOrder: null })
      );
    }

    // Execute Main Save and Side Effects in Parallel
    const [updatedOrder] = await Promise.all([
      order.save(),
      ...sideEffects
    ]);
    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

// DELETE order
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Only allow deletion of pending or cancelled orders
    if (!['pending', 'cancelled'].includes(order.status)) {
      return NextResponse.json({
        message: 'Cannot delete order that is not pending or cancelled'
      }, { status: 400 });
    }

    // Update table status if this was the current order
    const table = await Table.findById(order.tableId);
    if (table && table.currentOrder?.toString() === order._id.toString()) {
      table.status = 'available';
      table.currentOrder = null;
      await table.save();
    }

    await order.deleteOne();
    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
