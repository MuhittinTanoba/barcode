'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../config';
import ProductOptionsModal from './ProductOptionsModal';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-border overflow-hidden card-hover w-full h-full flex flex-col focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-left"
    >        
    {product.image && (
      <div className="relative w-full h-48 bg-muted">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
      </div>
    )}
      <div className="p-5 flex-grow flex flex-col justify-between w-full">
        <div>
          <h3 className="text-lg font-semibold text-foreground truncate mb-2">{product.title}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xl font-bold text-primary">{product.price?.toFixed(2)} TL</p>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
};

const ProductGrid = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (Array.isArray(data)) {
           const mappedProducts = data.map(p => ({
             _id: p.barkod,
             title: p.urun_adi,
             price: parseFloat(p.deger.replace(',', '.')),
             description: p.urun_kodu,
             options: p.options || [],
             // Add other fields if needed
           }));
          setProducts(mappedProducts);
        } else {
          throw new Error('Invalid products data');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };


    fetchProducts();
  }, []);

  const filteredProducts = products; // Remove category filtering for now or adapt if categories added later

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-primary">{t('processing')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-lg text-slate-500">{t('noProductsFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!selectedProduct && (
        <div className="overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} onClick={() => setSelectedProduct(product)} />
            ))}
          </div>
        </div>
      )}
      {selectedProduct && (
        <ProductOptionsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default ProductGrid;
