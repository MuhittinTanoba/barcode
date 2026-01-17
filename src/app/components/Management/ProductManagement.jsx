'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const ProductManagement = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState({ type: 'percentage', action: 'increase', value: '' });
  const [message, setMessage] = useState(null);

  const [newProduct, setNewProduct] = useState({
    barkod: '',
    urun_adi: '',
    urun_kodu: '',
    deger: '',
    category: 'urun'
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
       console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showMessage('error', 'Failed to load products');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/products', newProduct);
      setIsAddingProduct(false);
      setNewProduct({
        barkod: '',
        urun_adi: '',
        urun_kodu: '',
        deger: '',
        category: 'urun'
      });
      fetchProducts();
      showMessage('success', t('productAdded') || 'Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      showMessage('error', 'Failed to add product');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/products', editingProduct);
      setEditingProduct(null);
      fetchProducts();
      showMessage('success', t('productUpdated') || 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      showMessage('error', 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (barkod) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`/api/products?barkod=${barkod}`);
        fetchProducts();
        showMessage('success', t('productDeleted') || 'Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('error', 'Failed to delete product');
      }
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to update ALL product prices? This cannot be undone.')) return;
    
    try {
        await axios.put('/api/products/bulk', bulkAction);
        setIsBulkModalOpen(false);
        fetchProducts();
        showMessage('success', 'Bulk update successful');
    } catch (error) {
        console.error(error);
        showMessage('error', 'Failed to update products');
    }
  };

  const filteredProducts = products.filter(p => 
    p.urun_adi.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barkod.includes(searchQuery) ||
    p.urun_kodu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('productManagement')}</h2>
          <p className="text-gray-500 mt-1">{t('manageInventory') || 'Manage your product inventory'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
             <button
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-purple-600 text-white px-4 py-3 rounded-xl shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2 font-medium"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Bulk Price
            </button>
            <button
            onClick={() => setIsAddingProduct(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all duration-300 flex items-center gap-2 font-medium whitespace-nowrap"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('addNewProduct')}
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
            <input
                type="text"
                placeholder="Search products by name, barcode or code..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Bulk Update Modal */}
       {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Bulk Price Update</h3>
            </div>
            <form onSubmit={handleBulkUpdate} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={bulkAction.action}
                        onChange={(e) => setBulkAction({...bulkAction, action: e.target.value})}
                    >
                        <option value="increase">Increase Price</option>
                        <option value="decrease">Decrease Price</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={bulkAction.type}
                        onChange={(e) => setBulkAction({...bulkAction, type: e.target.value})}
                    >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (TL)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={bulkAction.value}
                        onChange={(e) => setBulkAction({...bulkAction, value: e.target.value})}
                        placeholder={bulkAction.type === 'percentage' ? 'e.g. 10 for 10%' : 'e.g. 5.00'}
                    />
                </div>
                 <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                    Warning: This will update prices for ALL products. This action cannot be undone.
                </div>
                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsBulkModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                    <button type="submit" className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Apply Update</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal Overlay */}
      {isAddingProduct && (
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
                  onClick={() => setIsAddingProduct(false)}
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
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('barcode')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('productName')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('category') || 'Category'}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('price')} (TL)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.urun_kodu} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                     {editingProduct?.barkod === product.barkod ? ( // Check using unique ID if strictly needed, but barcode is unique here mostly
                       <span className="font-mono text-gray-400">{product.barkod}</span>
                    ) : (
                      <span className="font-mono">{product.barkod}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingProduct?.barkod === product.barkod ? (
                      <input
                        type="text"
                        value={editingProduct.urun_adi}
                        onChange={(e) => setEditingProduct({ ...editingProduct, urun_adi: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                      />
                    ) : (
                      product.urun_adi
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {editingProduct?.barkod === product.barkod ? (
                      <input
                        type="text"
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                      />
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category || 'Uncategorized'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {editingProduct?.barkod === product.barkod ? (
                      <input
                        type="text"
                        value={editingProduct.deger}
                        onChange={(e) => setEditingProduct({ ...editingProduct, deger: e.target.value })}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                      />
                    ) : (
                      product.deger
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingProduct?.barkod === product.barkod ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleUpdateProduct}
                          className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md transition-colors"
                        >
                           {t('save')}
                        </button>
                        <button
                          onClick={() => setEditingProduct(null)}
                          className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded-md transition-colors"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1.5 hover:bg-blue-50 rounded-md"
                          title={t('edit')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.barkod)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-md"
                          title={t('delete')}
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;