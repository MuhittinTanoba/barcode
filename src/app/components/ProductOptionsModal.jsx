'use client'
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const ProductOptionsModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  // Stack: each level is { title, options }
  const [optionStack, setOptionStack] = useState([
    { title: null, options: product.options || [] }
  ]);
  // { optionId: true } for selected options
  const [selectedOptionIds, setSelectedOptionIds] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Recursive olarak alt seçenekleri gösteren fonksiyon
  const renderOptionsWithSub = (options, level = 0) => (
    <ul className={level === 0 ? 'space-y-3 mb-6' : 'space-y-3 mb-6 ml-6 border-l-2 border-primary/20 pl-4'}>
      {options.map(option => {
        const optionId = option._id?.$oid || option.name;
        const isOptionSelected = isSelected(option);
        return (
          <li key={optionId} className="w-full">
            <button
              onClick={() => handleOptionClick(option)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                isOptionSelected 
                  ? 'bg-secondary/30 border-2 border-primary/20 text-primary' 
                  : 'bg-muted/50 border-2 border-border hover:bg-muted hover:border-muted-foreground/20 text-foreground'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isOptionSelected 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground/30'
                }`}>
                  {isOptionSelected && (
                    <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                  )}
                </div>
                <span className="font-medium">{option.name}</span>
                {option.price >= 0 && (
                  <span className="text-sm text-muted-foreground">+${option.price}</span>
                )}
              </div>
              {isOptionSelected && (
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            {/* Eğer seçiliyse ve subOptions varsa, başlık ve alt seçenekleri göster */}
            {isOptionSelected && option.subOptions && option.subOptions.length > 0 && (
              <div className="mt-3">
                <div className="font-semibold text-primary mb-3 text-sm">{option.subOptions[0].title}</div>
                {renderOptionsWithSub(option.subOptions, level + 1)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  // Ana başlıklar (her zaman üstte)
  const mainTitles = [...new Set((product.options || []).map(opt => opt.title))];
  const [activeTitle, setActiveTitle] = useState(mainTitles[0] || null);
  const mainOptions = (product.options || []).filter(opt => opt.title === activeTitle);

  // When an option is clicked, select/deselect it and go deeper if subOptions exist
  const handleOptionClick = (option) => {
    const optionId = option._id?.$oid || option.name;
    setSelectedOptionIds(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
    setSelectedOptions(prev => {
      const exists = prev.some(sel => (sel._id?.$oid || sel.name) === optionId);
      if (exists) {
        return prev.filter(sel => (sel._id?.$oid || sel.name) !== optionId);
      } else {
        return [...prev, option];
      }
    });
    // Go deeper if subOptions exist
    if (option.subOptions && option.subOptions.length > 0) {
      setOptionStack([...optionStack, { title: option.name, options: option.subOptions }]);
    }
  };

  const handleConfirm = () => {
    addToCart(product, 1, selectedOptions);
    onClose();
  };

  // For checkmark
  const isSelected = (option) => {
    const optionId = option._id?.$oid || option.name;
    return !!selectedOptionIds[optionId];
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-background rounded-xl border border-border p-6 w-full max-w-2xl relative shadow-xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{product.title}</h2>
          <p className="text-muted-foreground text-sm">{t('modal.customizeOrder')}</p>
        </div>

        {/* Ana başlıklar her zaman üstte */}
        {mainTitles.length > 1 && (
          <div className="mb-6">
            <ul className="flex gap-2">
              {mainTitles.map(title => (
                <li key={title} className="flex-1">
                  <button
                    onClick={() => setActiveTitle(title)}
                    className={`w-full font-medium px-4 py-3 rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      activeTitle === title 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Selected options box */}
        {selectedOptions.length > 0 && (
          <div className="mb-6 bg-secondary/30 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-primary">{t('modal.selectedOptions')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map(opt => (
                <span 
                  key={opt._id?.$oid || opt.name} 
                  className="bg-secondary text-secondary-foreground rounded-lg px-3 py-1 text-sm font-medium"
                >
                  {opt.name} {opt.price?.$numberInt ? `(+${opt.price.$numberInt}$)` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Seçili başlığa ait ana seçenekler ve alt seçenekler */}
        <div className="max-h-96 overflow-y-auto">
          {renderOptionsWithSub(mainOptions)}
        </div>

        <div className="flex space-x-3 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            {t('modal.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {t('modal.addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductOptionsModal;