'use client'
import React from 'react';

import ProductManagement from './ProductManagement';

const Management = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Management System</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <ProductManagement />
        </div>
      </div>
    </div>
  );
};

export default Management; 