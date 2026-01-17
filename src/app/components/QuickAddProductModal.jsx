'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const QuickAddProductModal = ({ isOpen, onClose, initialBarcode, onSuccess }) => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  
  const [newProduct, setNewProduct] = useState({
    barkod: initialBarcode || '',
    urun_adi: '',
    urun_kodu: '',
    deger: '',
    category: 'urun'
  });

  useEffect(() => {
    if (initialBarcode) {
        setNewProduct(prev => ({ ...prev, barkod: initialBarcode }));
    }
  }, [initialBarcode]);

  useEffect(() => {
    if (isOpen) {
        fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
       console.error('Error fetching categories:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/products', newProduct);
      
      // Reset form
      setNewProduct({
        barkod: '',
        urun_adi: '',
        urun_kodu: '',
        deger: '',
        category: 'urun'
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">{t('addNewProduct')}</h3>
        </div>
        
        <form onSubmit={handleAddProduct} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('barcode')}</label>
              <input
                type="text"
                value={newProduct.barkod}
                onChange={(e) => setNewProduct({ ...newProduct, barkod: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="869..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('productName')}</label>
              <input
                type="text"
                value={newProduct.urun_adi}
                onChange={(e) => setNewProduct({ ...newProduct, urun_adi: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="Product Name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('productCode')}</label>
              <input
                type="text"
                value={newProduct.urun_kodu}
                onChange={(e) => setNewProduct({ ...newProduct, urun_kodu: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="CODE-123"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('price')} (TL)</label>
              <input
                type="text"
                value={newProduct.deger}
                onChange={(e) => setNewProduct({ ...newProduct, deger: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">{t('category') || 'Category'}</label>
              <select
                 value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.filter(c => c.slug !== 'all').map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
             <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 font-medium shadow-md transition-all"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddProductModal;
