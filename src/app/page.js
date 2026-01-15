'use client'
import ProductGrid from './components/ProductGrid';
import Order from './components/Order/Order';
import BarcodeListener from './components/BarcodeListener';
import ProtectedRoute from './components/ProtectedRoute';
import { useState } from 'react';

export default function Home() {


  return (
    <ProtectedRoute>
      <BarcodeListener />
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          <main className="lg:col-span-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-2 px-1">
                  <ProductGrid />
                </div>
              </div>
            </div>
          </main>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit sticky top-8">
              <Order />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
