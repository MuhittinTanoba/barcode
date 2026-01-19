'use client'
import ProductGrid from './components/ProductGrid';
import Order from './components/Order/Order';
import BarcodeListener from './components/BarcodeListener';
import ProtectedRoute from './components/ProtectedRoute';
import QuickAddProductModal from './components/QuickAddProductModal';
import { useState } from 'react';
import { useCart } from './context/CartContext';

export default function Home() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { addToCart } = useCart();

  const handleProductNotFound = (barcode) => {
    setScannedBarcode(barcode);
    setIsQuickAddOpen(true);
  };

  const handleProductAdded = (newProductData) => {
    // Increment trigger to refresh grid
    setRefreshTrigger(prev => prev + 1);

    // Auto add to cart if we have valid data
    // Map the raw product data to the format ProductGrid uses (and thus Cart expects)
    if (newProductData) {
      const mappedProduct = {
        _id: `${newProductData.barkod}-${newProductData.urun_adi}`,
        barcode: newProductData.barkod,
        title: newProductData.urun_adi,
        price: newProductData.deger ? parseFloat(newProductData.deger.toString().replace(',', '.')) : 0,
        description: '',
        category: newProductData.category,
        options: [] // New products have no options initially
      };
      addToCart(mappedProduct);
    }
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
              <ProductGrid refreshTrigger={refreshTrigger} />
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
