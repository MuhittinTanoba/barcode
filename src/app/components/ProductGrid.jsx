'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../config';
import { useCart } from '../context/CartContext';
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
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (Array.isArray(data)) {
           const mappedProducts = data.map(p => ({
             _id: p.urun_kodu,
             title: p.urun_adi,
             price: p.deger ? parseFloat(p.deger.toString().replace(',', '.')) : 0,
             description: p.urun_kodu,
             category: p.category, // Include category
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

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('diger');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => (p.category || 'urun') === selectedCategory);

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

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="mb-4 overflow-x-auto pb-2 scrollbar-hide flex-none px-2">
        <div className="flex space-x-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === category.slug
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 flex-grow flex items-center justify-center">
           <div className="flex flex-col items-center space-y-4">
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg text-slate-500">{t('noProductsFound')}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto flex-grow min-h-0 -mx-1 px-1">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} onClick={() => addToCart(product)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
