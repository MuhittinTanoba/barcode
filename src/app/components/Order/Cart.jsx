import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

function renderOptions(options, t, level = 0) {
  if (!options || options.length === 0) return null;
  
  // Filter out options that are already shown as sub-options
  const topLevelOptions = options.filter(option => {
    // Check if this option is a sub-option of any other option in the list
    return !options.some(otherOption => 
      otherOption.subOptions && 
      otherOption.subOptions.some(subOpt => 
        (subOpt._id?.$oid || subOpt.name) === (option._id?.$oid || option.name)
      )
    );
  });
  
  // Group options by title
  const groupedOptions = topLevelOptions.reduce((groups, option) => {
    const title = option.title || (t ? t('modal.options') : 'Options');
    if (!groups[title]) {
      groups[title] = [];
    }
    groups[title].push(option);
    return groups;
  }, {});
  
  return (
    <ul className={level === 0 ? 'mt-2' : ''} style={{ marginLeft: level * 16 }}>
      {Object.entries(groupedOptions).map(([title, titleOptions]) => (
        <li key={title} className="mb-2">
          <div className="font-medium text-slate-700 text-sm mb-1">{title}</div>
          <ul style={{ marginLeft: 16 }}>
            {titleOptions.map((option, i) => (
              <li key={option._id?.$oid || option.name + i} className="text-xs text-slate-600 mb-1">
                <span>
                  {option.name} {option.price ? `(+${option.price} TL)` : ''}
                </span>
                {/* Only show sub-options if this option has sub-options and they are selected */}
                {option.subOptions && option.subOptions.length > 0 && 
                 option.subOptions.some(subOpt => options.includes(subOpt)) && 
                 renderOptions(option.subOptions.filter(subOpt => options.includes(subOpt)), level + 1)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

import AddExpenseModal from './AddExpenseModal';

const Cart = ({ onCheckout, orderType = 'dine_in' }) => {
  const { cartItems, removeFromCart, updateQuantity, updateDescription, getTotalAmount, clearCart, addToCart } = useCart();
  const { t } = useLanguage();
  const [isClearCartModalOpen, setIsClearCartModalOpen] = React.useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false);

  const handleClearCart = () => {
    clearCart();
    setIsClearCartModalOpen(false);
  };

  const handleAddManualItem = (data) => {
      const manualProduct = {
          _id: `manual-${Date.now()}`,
          title: data.description,
          name: data.description,
          price: data.amount,
          quantity: 1,
          options: [],
          description: ''
      };
      addToCart(manualProduct);
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col items-center space-y-4 py-8">
          <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-slate-500 font-medium">{t('cart.empty')}</p>
          <p className="text-slate-400 text-sm">{t('cart.addProducts')}</p>
          
          <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-4 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center gap-1"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Manual Item
            </button>
            <AddExpenseModal 
                isOpen={isExpenseModalOpen} 
                onClose={() => setIsExpenseModalOpen(false)}
                onAdd={handleAddManualItem} 
            />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">{t('cart.title')}</h2>
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2">{cartItems.length} {t('cart.items')}</span>
            
            <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-slate-400 hover:text-orange-600 transition-colors p-1.5 rounded-lg hover:bg-orange-50 bg-slate-50 border border-slate-200"
                title="Add Manual Item"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </button>

            <button 
                onClick={() => setIsClearCartModalOpen(true)}
                className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 bg-slate-50 border border-slate-200"
                title="Clear Cart"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {cartItems.map((item, index) => (
          <div key={index} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm truncate">{item.title || item.name}</h3>
              {item.options.length > 0 && renderOptions(item.options, t)}
              <div className="mt-2">
                <input
                  type="text"
                  placeholder={t('cart.specialNotePlaceholder')}
                  value={item.description || ''}
                  onChange={(e) => updateDescription(index, e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={500}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                <button
                  onClick={() => updateQuantity(index, item.quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-8 text-center text-sm font-medium text-slate-700">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(index, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              
              <div className="text-right min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {((item.unitPrice * item.quantity) + 
                     (item.options.reduce((sum, opt) => sum + opt.price, 0) * item.quantity)).toFixed(2)} TL
                </div>
              </div>
              
              <button
                onClick={() => removeFromCart(index)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-semibold text-primary">{t('cart.total')}:</span>
          <span className="text-2xl font-bold text-primary">{getTotalAmount().toFixed(2)} TL</span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full bg-primary text-white py-3 px-4 rounded-xl hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/80 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {orderType === 'to_go' ? t('cart.confirmOrder') : t('cart.createOrder')}
        </button>
      </div>

      {isClearCartModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Clear Cart</h3>
                    <p className="text-gray-500 mb-6">Are you sure you want to remove all items from the cart?</p>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsClearCartModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleClearCart}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium shadow-md transition-all"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <AddExpenseModal 
         isOpen={isExpenseModalOpen} 
         onClose={() => setIsExpenseModalOpen(false)}
         onAdd={handleAddManualItem} 
      />
    </div>
  );
};

export default Cart; 