'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductGrid from '../ProductGrid';

const TableCart = ({ tableId, existingOrder, onOrderComplete, onClose }) => {
  const { cartItems, clearCart, getTotalAmount, addToCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProducts, setShowProducts] = useState(false);

  // Load existing order items into cart if editing
  useEffect(() => {
    // Always clear cart first
    clearCart();
    
    if (existingOrder && existingOrder.items && existingOrder.items.length > 0) {
      existingOrder.items.forEach(item => {
        addToCart({
          productId: item.productId,
          name: item.name || item.title,
          title: item.title || item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          options: item.options || [],
          description: item.description || ''
        });
      });
    }
  }, [existingOrder, tableId, clearCart, addToCart]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const totalAmount = getTotalAmount();
      
      if (existingOrder) {
        // Update existing order
        const orderData = {
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            options: item.options || [],
            description: item.description || ''
          })),
          totalAmount: totalAmount
        };

        const updateResponse = await axios.put(`${appConfig.orderApiUrl}/${existingOrder._id}`, orderData);
        console.log('Order updated successfully');
        
        // Mutfak Yazıcısına Gönder (Otomatik)
        try {
          // Use the response data if available, or construct print data
          // Ideally the API returns the updated order. If not we use orderData + id
          const orderToPrint = updateResponse.data || { ...orderData, _id: existingOrder._id };
          await axios.post('/api/printer/kitchen', orderToPrint);
          console.log('Order sent to kitchen printer');
        } catch (printError) {
          console.error('Failed to print to kitchen:', printError);
          // Don't block the UI for print error, just log it
        }
      } else {
        // Create new order
        const orderData = {
          tableId: tableId,
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            options: item.options || [],
            description: item.description || ''
          })),
          totalAmount: totalAmount,
          status: 'pending',
          paymentStatus: 'unpaid',
          takenBy: user?._id || undefined
        };

        const createResponse = await axios.post(appConfig.orderApiUrl, orderData, {
          headers: user?._id ? { 'x-employee-id': user._id } : undefined
        });
        console.log('Order created successfully');
        
        // Mutfak Yazıcısına Gönder (Otomatik)
        try {
          const orderToPrint = createResponse.data || orderData; // Fallback might lack _id if API doesn't return it
          await axios.post('/api/printer/kitchen', orderToPrint);
          console.log('New order sent to kitchen printer');
        } catch (printError) {
          console.error('Failed to print to kitchen:', printError);
        }
      }

      clearCart();
      onOrderComplete();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process order');
      console.error('Order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const renderOptions = (options, level = 0) => {
    if (!options || options.length === 0) return null;
    
    const topLevelOptions = options.filter(option => {
      return !options.some(otherOption => 
        otherOption.subOptions && 
        otherOption.subOptions.some(subOpt => 
          (subOpt._id?.$oid || subOpt.name) === (option._id?.$oid || option.name)
        )
      );
    });
    
    const groupedOptions = topLevelOptions.reduce((groups, option) => {
      const title = option.title || 'Options';
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(option);
      return groups;
    }, {});
    
    return (
      <ul className={level === 0 ? 'mt-2' : ''} style={{ marginLeft: level * 16 }}>
        {Object.entries(groupedOptions).map(([title, titleOptions]) => (
          <li key={title} className="mb-2">
            <div className="font-semibold text-foreground text-sm mb-1">{title}</div>
            <ul style={{ marginLeft: 16 }}>
              {titleOptions.map((option, i) => (
                <li key={option._id?.$oid || option.name + i} className="text-xs text-muted-foreground mb-1">
                  <span>
                    {option.name} {option.price ? <span className="text-accent font-medium">(+{option.price} TL)</span> : ''}
                  </span>
                  {option.subOptions && option.subOptions.length > 0 && 
                   option.subOptions.some(subOpt => options.includes(subOpt)) && 
                   renderOptions(option.subOptions.filter(subOpt => options.includes(subOpt)), level + 1)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {existingOrder ? 'Edit Order' : 'Create Order'} - Table {tableId}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Add items to create or update the order</p>
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

        {/* Main Content */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Products Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Products</h3>
              <button
                onClick={() => setShowProducts(!showProducts)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/25"
              >
                {showProducts ? 'Hide Products' : 'Show Products'}
              </button>
            </div>
            
            {showProducts && (
              <div className="border border-border rounded-xl p-4 bg-muted/20">
                <ProductGrid />
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="w-96 flex flex-col border-l border-border pl-6">
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Order Items</h3>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-foreground font-medium mb-1">No items in order</p>
                  <p className="text-muted-foreground text-sm">Add products to create order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground text-sm">
                          {item.title || item.name}
                        </h4>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency((item.unitPrice * item.quantity) + 
                            (item.options.reduce((sum, opt) => sum + (opt.price || 0), 0) * item.quantity))}
                        </span>
                      </div>
                      
                      {item.options.length > 0 && renderOptions(item.options)}
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </div>
                      
                      {item.description && (
                        <div className="text-xs text-accent italic bg-secondary/20 px-2 py-0.5 rounded">
                          Note: {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total and Actions */}
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-foreground">Total:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(getTotalAmount())}
                </span>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all font-medium ${
                    loading || cartItems.length === 0
                      ? 'bg-muted cursor-not-allowed text-muted-foreground'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    existingOrder ? 'Update Order' : 'Create Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableCart;
