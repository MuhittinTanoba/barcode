'use client'
import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((product, quantity = 1, options = [], description = '') => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === product._id && 
        JSON.stringify(item.options) === JSON.stringify(options) &&
        item.description === description
      );

      if (existingItemIndex > -1) {
        return prevItems.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, {
        productId: product._id,
        name: product.title,
        quantity,
        unitPrice: product.price,
        options,
        description
      }];
    });
  }, []);

  const removeFromCart = useCallback((index) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index, quantity) => {
    if (quantity <= 0) return;
    setCartItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    );
  }, []);

  const updateDescription = useCallback((index, description) => {
    setCartItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, description } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalAmount = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const optionsTotal = item.options.reduce((sum, option) => sum + option.price, 0);
      return total + itemTotal + (optionsTotal * item.quantity);
    }, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateDescription,
      clearCart,
      getTotalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
}; 