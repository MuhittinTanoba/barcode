'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const ProductManagement = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    barkod: '',
    urun_adi: '',
    urun_kodu: '',
    deger: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
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
        deger: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/products', editingProduct);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (barkod) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`/api/products?barkod=${barkod}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Helper to safely display price
  const formatPrice = (val) => val; 

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t('productManagement')}</h2>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {t('addNewProduct')}
        </button>
      </div>

      {isAddingProduct && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold mb-2">{t('addNewProduct')}</h3>
          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t('barcode')}
                value={newProduct.barkod}
                onChange={(e) => setNewProduct({ ...newProduct, barkod: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder={t('productName')}
                value={newProduct.urun_adi}
                onChange={(e) => setNewProduct({ ...newProduct, urun_adi: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder={t('productCode')}
                value={newProduct.urun_kodu}
                onChange={(e) => setNewProduct({ ...newProduct, urun_kodu: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder={t('price')}
                value={newProduct.deger}
                onChange={(e) => setNewProduct({ ...newProduct, deger: e.target.value })}
                className="border p-2 rounded"
                required
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {t('save')}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingProduct(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('barcode')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productCode')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('price')} (TL)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.barkod}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingProduct?.barkod === product.barkod ? (
                    <input
                      type="text"
                      disabled // Barcode usually shouldn't change or acts as ID
                      value={editingProduct.barkod}
                      className="border p-1 rounded bg-gray-100"
                    />
                  ) : (
                    product.barkod
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingProduct?.barkod === product.barkod ? (
                    <input
                      type="text"
                      value={editingProduct.urun_adi}
                      onChange={(e) => setEditingProduct({ ...editingProduct, urun_adi: e.target.value })}
                      className="border p-1 rounded"
                    />
                  ) : (
                    product.urun_adi
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingProduct?.barkod === product.barkod ? (
                    <input
                      type="text"
                      value={editingProduct.urun_kodu}
                      onChange={(e) => setEditingProduct({ ...editingProduct, urun_kodu: e.target.value })}
                      className="border p-1 rounded"
                    />
                  ) : (
                    product.urun_kodu
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingProduct?.barkod === product.barkod ? (
                    <input
                      type="text"
                      value={editingProduct.deger}
                      onChange={(e) => setEditingProduct({ ...editingProduct, deger: e.target.value })}
                      className="border p-1 rounded"
                    />
                  ) : (
                    product.deger
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingProduct?.barkod === product.barkod ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateProduct}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1"
                      >
                         {t('save')}
                      </button>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 flex items-center gap-1"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center gap-1"
                      >
                         {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.barkod)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1"
                      >
                         {t('delete')}
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
  );
};

export default ProductManagement;