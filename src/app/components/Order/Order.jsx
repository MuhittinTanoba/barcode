'use client'
import React, { useState } from 'react';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import Cart from './Cart';
import appConfig from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import PaymentModal from './PaymentModal';

const Order = () => {
  const { cartItems, clearCart, getTotalAmount } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) {
      setError(t('cartEmpty'));
      return;
    }
    setError(null);
    setShowPaymentModal(true);
  };

  const processPayment = async (paymentMethod) => {
    try {
      const totalAmount = getTotalAmount();
      const orderData = {
        items: cartItems.map(item => ({
          productId: String(item.productId),
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          options: (item.options || []).map(opt => ({
             name: opt.name,
             price: Number(opt.price || 0)
          })),
          description: item.description || ''
        })),
        total: Number(totalAmount),
        paymentMethod: paymentMethod
      };

      const response = await axios.post('/api/orders', orderData);
      console.log('Order created:', response.data);
      // Wait for modal to close to clear cart
    } catch (error) {
      console.error('Payment processing failed:', error);
      if (error.response) {
         console.error('Server Error Data:', error.response.data);
         // Alert user to specific error if needed
      }
      throw error; // Re-throw to let modal handle error state
    }
  };

  const handleModalClose = () => {
    setShowPaymentModal(false);
    clearCart();
  };

  return (
    <div className="h-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      <Cart onCheckout={handleCheckoutClick} orderType="to_go" />
      
      {showPaymentModal && (
        <PaymentModal
          total={getTotalAmount()}
          onClose={handleModalClose}
          onProcessPayment={processPayment}
        />
      )}
    </div>
  );
};

export default Order;
 