'use client'
import React, { useState } from 'react';
import ProductManagement from './ProductManagement';
import CategoryManagement from './CategoryManagement';

const Management = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
             <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
          </div>
          <div className="flex space-x-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'products'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
              {activeTab === 'products' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'categories'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Categories
              {activeTab === 'categories' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
         {activeTab === 'products' ? <ProductManagement /> : <CategoryManagement />}
      </div>
    </div>
  );
};

export default Management; 