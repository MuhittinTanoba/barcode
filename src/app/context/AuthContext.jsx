'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Mock user for Market POS
  const mockUser = {
    _id: 'market-user',
    username: 'cashier',
    firstName: 'Market',
    lastName: 'Cashier',
    role: 'admin', // Give admin role to access everything
  };

  const [user, setUser] = useState(mockUser);
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    // Always succeed
    setUser(mockUser);
    localStorage.setItem('bossPosUser', JSON.stringify(mockUser));
    return { success: true, data: mockUser };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('bossPosUser');
  };

  const isManager = () => true;
  const isCashier = () => true;
  const isAdmin = () => true;
  const isAuthenticated = () => !!user;

  const hasPermission = (permission) => true;

  const value = {
    user,
    loading,
    login,
    logout,
    isManager,
    isCashier,
    isAdmin,
    isAuthenticated,
    hasPermission
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          await logout();
          // Optional: You could enable this if you want to force redirect, 
          // but usually logout() clearing state triggers ProtectedRoute to redirect.
          // router.push('/login'); 
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
