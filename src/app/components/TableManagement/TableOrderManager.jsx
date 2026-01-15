'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';
import PaymentPage from '../Order/PaymentPage';
import TableCart from './TableCart';
import { useCart } from '../../context/CartContext';

const TableOrderManager = ({ table, onClose, onOrderUpdate }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { cartItems, clearCart } = useCart();

  // Get table's current order from table object
  const fetchTableOrder = async () => {
    try {
      setLoading(true);
      
      // Check if table has a current order
      if (table.currentOrder) {
        setOrder(table.currentOrder);
      } else {
        setOrder(null);
      }
    } catch (err) {
      setError('Failed to fetch order');
      console.error('Error fetching table order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableOrder();
    
    // Cleanup on unmount
    return () => {
      setOrder(null);
      setError(null);
      setShowPayment(false);
      setShowCart(false);
    };
  }, [table._id, table.currentOrder]);

  const handleCreateOrder = () => {
    setShowCart(true);
  };

  const handleEditOrder = () => {
    if (order) {
      setShowCart(true);
    }
  };

  const handlePayment = () => {
    if (order) {
      setShowPayment(true);
    }
  };

  const handleOrderComplete = () => {
    setShowCart(false);
    setShowPayment(false);
    // Refresh the table data to get updated currentOrder
    onOrderUpdate && onOrderUpdate();
  };

  const handleCloseCart = () => {
    setShowCart(false);
    clearCart();
  };

  const handleClosePayment = () => {
    setShowPayment(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-secondary/50 text-foreground border-secondary';
      case 'preparing': return 'bg-primary/10 text-primary border-primary/20';
      case 'served': return 'bg-accent/10 text-accent border-accent/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'served': return 'Served';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-border">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Table {table.number} - {table.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {table.location?.name} • {table.capacity} seats
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        {/* Table Status */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${
            table.status === 'available' ? 'bg-accent/10 text-accent border-accent/20' :
            table.status === 'occupied' ? 'bg-destructive/10 text-destructive border-destructive/20' :
            'bg-secondary/30 text-foreground border-secondary'
          }`}>
            {table.status === 'available' ? 'Available' :
             table.status === 'occupied' ? 'Occupied' :
             'Waiting for Payment'}
          </div>
        </div>

        {/* Order Content */}
        {order ? (
          /* Existing Order */
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-muted/30 p-5 rounded-xl border border-border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-1">Current Order</h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(order.createdAt).toLocaleString('en-US')}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              
              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-start bg-white p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-foreground">
                          {item?.title || item?.name || 'Unknown Product'}
                        </span>
                        <span className="text-foreground font-bold">
                          {formatCurrency((item?.unitPrice || 0) * item.quantity)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatCurrency(item?.unitPrice || 0)}
                      </div>
                      {item.description && (
                        <div className="text-xs text-accent italic mt-1 bg-secondary/20 px-2 py-0.5 rounded">
                          Note: {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-foreground">Total:</span>
                  <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEditOrder}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/25"
              >
                Add Items
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-3 px-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all font-medium shadow-lg shadow-accent/25"
              >
                Process Payment
              </button>
            </div>
          </div>
        ) : (
          /* No Order - Create New */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Active Order</h3>
            <p className="text-muted-foreground mb-6">This table is available for a new order.</p>
            <button
              onClick={handleCreateOrder}
              className="py-3 px-8 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/25"
            >
              Create New Order
            </button>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <TableCart
          tableId={table._id}
          existingOrder={order}
          onOrderComplete={handleOrderComplete}
          onClose={handleCloseCart}
        />
      )}

      {/* Payment Modal */}
      {showPayment && order && (
        <PaymentPage
          order={order}
          onClose={handleClosePayment}
          onPaymentComplete={handleOrderComplete}
        />
      )}
    </div>
  );
};

export default TableOrderManager;
