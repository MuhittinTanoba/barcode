'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

const WeightInputModal = ({ isOpen, onClose, onConfirm, product }) => {
  const { t } = useLanguage();
  const [weightGrams, setWeightGrams] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setWeightGrams('');
      // Focus after a small delay to ensure render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const grams = parseFloat(weightGrams);
    if (!grams || grams <= 0) return;
    
    // Convert to kg
    const weightKg = grams / 1000;
    onConfirm(weightKg);
    onClose();
  };

  if (!isOpen || !product) return null;

  const grams = parseFloat(weightGrams) || 0;
  const price = (grams / 1000) * product.price;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">{product.title}</h3>
          <p className="text-sm text-gray-500">Unit Price: {product.price} TL / kg</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-xl font-medium text-center text-gray-700">Enter Weight (Grams)</label>
            <div className="relative">
                <input
                ref={inputRef}
                type="number"
                required
                min="0"
                step="1"
                className="w-full text-center text-3xl font-bold border-2 border-primary/20 rounded-xl px-4 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                placeholder="0"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                data-keyboard="numeric"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">g</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-sm text-gray-500 mb-1">Calculated Price</p>
            <p className="text-3xl font-bold text-primary">{price.toFixed(2)} TL</p>
            <p className="text-sm text-gray-400 mt-1">{(grams / 1000).toFixed(3)} kg</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary/90 font-medium shadow-lg transition-all"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeightInputModal;
