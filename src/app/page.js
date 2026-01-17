'use client'
import ProductGrid from './components/ProductGrid';
import Order from './components/Order/Order';
import BarcodeListener from './components/BarcodeListener';
import ProtectedRoute from './components/ProtectedRoute';
import QuickAddProductModal from './components/QuickAddProductModal';
import { useState } from 'react';

export default function Home() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  const handleProductNotFound = (barcode) => {
    setScannedBarcode(barcode);
    setIsQuickAddOpen(true);
  };

  const handleProductAdded = () => {
    // Refresh the page or trigger product reload
    window.location.reload();
  };

  return (
    <ProtectedRoute>
      <BarcodeListener onNotFound={handleProductNotFound} />
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialBarcode={scannedBarcode}
        onSuccess={handleProductAdded}
      />
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-4rem)]">
          <main className="h-full overflow-hidden">
            <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 py-2 px-1 overflow-hidden">
              <ProductGrid />
            </div>
          </main>
          <div className="h-full">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full sticky top-8 overflow-hidden">
              <Order />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
