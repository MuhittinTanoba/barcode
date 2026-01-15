'use client'
import React, { useState } from 'react';
import axios from 'axios';
import appConfig from '../../config';

const OrderHistory = ({ orders, onRefresh }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [returningOrder, setReturningOrder] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'returned':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Paid';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      await axios.put(`${appConfig.orderApiUrl}/${orderId}`, {
        status: newStatus
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancellingOrder(orderId);
      await axios.put(`${appConfig.orderApiUrl}/${orderId}`, {
        status: 'cancelled'
      });
      onRefresh();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleReturnOrder = async (order, payment) => {
      const isCard = payment.method === 'card';
      const isCash = payment.method === 'cash';

      if (isCard) {
          // Redirect to Card Operations for Void/Return
          if (!payment.transactionId) {
              alert('No transaction linked for this card payment. Cannot auto-fill return.');
              // Fallback: Just go there or alert? User might still want to manual return.
              // Letting them proceed empty is better than blocking.
              window.location.href = `/card-operations?action=EMVReturn`; 
              return;
          }
           // We'll direct to VoidSaleByRecordNo if it's recent (same day? Batch open? we don't know state), 
           // OR EMVReturn. Safe bet is usually Void if it was just made, but Return is safer universally to not Error.
           // However, user asked for "Return".
          const transactionId = typeof payment.transactionId === 'object' ? payment.transactionId._id : payment.transactionId;
          window.location.href = `/card-operations?transactionId=${transactionId}&action=EMVReturn`;
      } else if (isCash) {
          if (!confirm(`Process CASH Return for Order #${order._id.slice(-6)}?\nAmount: $${payment.amount.toFixed(2)}`)) {
              return;
          }
          
          try {
              setReturningOrder(order._id);
              // Mark as returned. Note: Backend logic for 'returned' revenue exclusion handles the rest.
              // We might want to clear 'paidAt' or similar, but status='returned' is the key.
              await axios.put(`${appConfig.orderApiUrl}/${order._id}`, {
                  status: 'returned',
                  description: order.description ? `${order.description} | Returned (Cash)` : 'Returned (Cash)'
              });
              onRefresh();
          } catch (e) {
              console.error("Cash return failed:", e);
              alert("Failed to process cash return");
          } finally {
              setReturningOrder(null);
          }
      }
  };

  const OrderItem = ({ item }) => {
    if (!item || typeof item !== 'object') {
      console.warn('OrderItem received invalid item:', item);
      return null;
    }

    return (
      <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground mb-1">{item.name || 'Unknown Item'}</p>
          {item.options && item.options.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {item.options.map(opt => opt.name).join(', ')}
            </p>
          )}
          {item.description && (
            <p className="text-xs text-accent mt-1 italic">
              Note: {item.description}
            </p>
          )}
        </div>
        <div className="text-right ml-4">
          <p className="font-bold text-foreground">${(item.unitPrice || 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">x{item.quantity || 1}</p>
        </div>
      </div>
    );
  };

  const OrderCard = ({ order }) => {
    if (!order || typeof order !== 'object') {
      console.warn('OrderCard received invalid order:', order);
      return null;
    }

    const isExpanded = expandedOrder === order._id;
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden card-hover">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-foreground">Order #{order._id?.slice(-6)}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Table: {order.tableId?.name || order.tableId?.number || 'N/A'}</span>
              </div>
            </div>
            <button
              onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Date</p>
              <p className="font-semibold text-sm text-foreground">{formatDate(order.createdAt).split(',')[0]}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt).split(',')[1]?.trim()}</p>
            </div>
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="font-bold text-lg text-accent">${(order.totalAmount || 0).toFixed(2)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Items</p>
              <p className="font-semibold text-lg text-foreground">{totalItems}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => updateOrderStatus(order._id, 'paid')}
                  disabled={updatingStatus === order._id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updatingStatus === order._id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Mark as Paid</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCancelOrder(order._id)}
                  disabled={cancellingOrder === order._id}
                  className="px-4 py-2 bg-destructive text-white rounded-lg text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {cancellingOrder === order._id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel</span>
                    </>
                  )}
                </button>
              </>
            )}
            {order.status === 'paid' && (
              <>
                 <button
                    onClick={() => updateOrderStatus(order._id, 'pending')}
                    disabled={updatingStatus === order._id}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updatingStatus === order._id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Mark as Pending</span>
                      </>
                    )}
                  </button>
                  {/* Return Button for Paid Orders */}
                  {order.payments && order.payments.length > 0 && order.payments.map((payment, idx) => (
                      <button 
                          key={idx}
                          onClick={() => handleReturnOrder(order, payment)}
                          disabled={returningOrder === order._id}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                           {returningOrder === order._id ? (
                               <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                           ) : (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                               </svg>
                           )}
                           <span>Return ({payment.method})</span>
                      </button>
                  ))}
              </>
            )}
            {(order.status === 'cancelled' || order.status === 'returned') && (
              <button
                onClick={() => updateOrderStatus(order._id, 'pending')}
                disabled={updatingStatus === order._id}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingStatus === order._id ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Reactivate</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Expanded Order Details */}
          {isExpanded && (
            <div className="border-t border-border pt-5 mt-5">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Order Details
              </h4>
              <div className="space-y-2">
                {order.items?.map((item, index) => {
                  if (!item || typeof item !== 'object') {
                    console.warn('Invalid item in order:', item);
                    return null;
                  }
                  return <OrderItem key={index} item={item} />;
                })}
              </div>
              
              {/* Payment Details */}
              {order.payments && order.payments.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                      <h5 className="text-sm font-bold text-green-800 mb-2">Payment History</h5>
                      <div className="space-y-2">
                          {order.payments.map((pay, i) => (
                              <div key={i} className="text-sm text-green-700 flex justify-between">
                                  <span>
                                      <span className="font-semibold capitalize">{pay.method}</span>: ${pay.amount.toFixed(2)}
                                  </span>
                                  <span className="text-xs opacity-75">
                                      {new Date(pay.timestamp).toLocaleString()}
                                      {pay.transactionId && <span className="ml-2 font-mono bg-green-200 px-1 rounded text-xs">TranID: Linked</span>}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              
              {order.notes && (
                <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-secondary/50">
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes:
                  </p>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Orders Found</h3>
          <p className="text-muted-foreground">No orders match the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.slice(0, showAllOrders ? orders.length : 10).map((order) => {
          if (!order || typeof order !== 'object' || !order._id) {
            console.warn('Invalid order object:', order);
            return null;
          }
          return <OrderCard key={order._id} order={order} />;
        })}
        {orders.length > 10 && (
          <div className="flex justify-center pt-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowAllOrders(!showAllOrders);
              }}
              className="px-6 py-3 text-sm font-semibold text-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors border border-border"
            >
              {showAllOrders ? 'Show Less' : `Show All Orders (${orders.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
