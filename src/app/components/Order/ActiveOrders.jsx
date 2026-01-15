'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';
import PaymentPage from './PaymentPage';

const ActiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(appConfig.orderApiUrl);
      console.log('Received order data:', response.data);

      // Only filter by status, show all orders except 'paid' and 'cancelled'
      const activeOrders = response.data.filter(order => 
        order.status !== 'paid' && order.status !== 'cancelled'
      );

      console.log('Filtered active orders:', activeOrders);
      setOrders(activeOrders);
      setError(null);
    } catch (err) {
      setError('Error loading orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handlePaymentComplete = () => {
    setSelectedOrder(null);
    fetchOrders(); // Refresh orders
  };

  const handleClosePayment = () => {
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId, event) => {
    event.stopPropagation(); // Prevent triggering the order click
    
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancellingOrder(orderId);
      await axios.put(`${appConfig.orderApiUrl}/${orderId}`, {
        status: 'cancelled'
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-secondary/50 text-foreground border-secondary';
      case 'preparing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'served':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'preparing':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'served':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading active orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Active Orders</h2>
          <p className="text-muted-foreground mt-2">Manage and process pending orders</p>
        </div>
        <div className="flex items-center space-x-2 bg-secondary/30 px-4 py-2 rounded-lg">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-medium text-foreground">{orders.length} active orders</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-foreground">No active orders</p>
            <p className="text-sm text-muted-foreground">All orders have been processed</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div 
              key={order._id} 
              className="group bg-white rounded-xl border border-border p-6 cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 card-hover"
              onClick={() => handleOrderClick(order)}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg mb-1">
                    {order.orderType === 'to_go' ? 'To-Go' : `Table ${order.tableId?.number || 'N/A'}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString('en-US')}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center space-x-1.5 shrink-0 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>
                    {order.status === 'pending' ? 'Pending' :
                     order.status === 'preparing' ? 'Preparing' :
                     order.status === 'served' ? 'Served' :
                     order.status === 'cancelled' ? 'Cancelled' :
                     order.status}
                  </span>
                </span>
              </div>
              
              <div className="space-y-2.5 mb-5">
                {order.items?.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item?.title || item?.name || 'Unknown Product'} × {item.quantity}
                      </span>
                      <span className="font-semibold text-foreground">
                        ${((item?.unitPrice || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <div className="text-xs text-accent italic ml-2 bg-secondary/20 px-2 py-0.5 rounded">
                        Note: {item.description}
                      </div>
                    )}
                  </div>
                ))}
                {order.description && (
                   <div className="mt-2 text-xs italic text-gray-600 bg-gray-50 border p-2 rounded">
                       <strong>Order Note:</strong> {order.description}
                   </div>
                )}
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">
                    ${order.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                  onClick={(e) => handleCancelOrder(order._id, e)}
                  disabled={cancellingOrder === order._id || order.status === 'cancelled'}
                  className="px-3 py-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/20 hover:border-destructive/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  {cancellingOrder === order._id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-destructive"></div>
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
                
                <div className="flex items-center text-accent group-hover:text-primary transition-colors">
                  <span className="text-sm font-medium">Click to process payment</span>
                  <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Page Modal */}
      {selectedOrder && (
        <PaymentPage
          order={selectedOrder}
          onClose={handleClosePayment}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default ActiveOrders; 