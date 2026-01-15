'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../config';
import { useAuth } from './AuthContext';

const OrderStatusContext = createContext();

export const useOrderStatus = () => {
  const context = useContext(OrderStatusContext);
  if (!context) {
    throw new Error('useOrderStatus must be used within an OrderStatusProvider');
  }
  return context;
};

export const OrderStatusProvider = ({ children }) => {
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const { logout } = useAuth();

  const fetchActiveOrdersCount = async () => {
    try {
      const response = await axios.get(appConfig.orderApiUrl);
      const activeOrders = response.data.filter(order => 
        ['pending', 'preparing', 'served'].includes(order.status)
      );
      setActiveOrdersCount(activeOrders.length);
    } catch (error) {
      console.error('Error fetching active orders:', error);
      if (error.response && error.response.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    fetchActiveOrdersCount();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchActiveOrdersCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <OrderStatusContext.Provider value={{ activeOrdersCount, refreshOrders: fetchActiveOrdersCount }}>
      {children}
    </OrderStatusContext.Provider>
  );
}; 