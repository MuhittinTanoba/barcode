'use client';
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const PaymentModal = ({ total, items = [], onClose, onProcessPayment }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState('selection'); // selection, cash_input, summary
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMethodSelect = async (method) => {
    setPaymentMethod(method);
    if (method === 'card') {
      await processOrder(method);
    } else {
      setStep('cash_input');
    }
  };

  const handleCashConfirm = async () => {
    const tendered = parseFloat(tenderedAmount) || total;
    if (tendered < total) {
      alert(t('insufficientAmount') || 'Amount is less than total');
      return;
    }
    setChange(tendered - total);
    await processOrder('cash');
  };

  const processOrder = async (method) => {
    setIsProcessing(true);
    try {
      await onProcessPayment(method);
      setStep('summary');
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || t('errorCreatingOrder');
      alert(`${t('errorCreatingOrder')}: ${errorMessage}\n${JSON.stringify(error.response?.data || {})}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    try {
      const orderData = {
        _id: Date.now(), // Temporary ID for receipt
        items: items,
        totalAmount: total,
        paymentMethod: paymentMethod,
        tableId: { number: 'Counter' },
        date: new Date().toISOString()
      };

      const response = await fetch('/api/print/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderData,
          type: 'cashier' 
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Print failed');
      }
      
      // Optional: Show success message
      // alert('Receipt sent to printer!');
    } catch (error) {
      console.error('Printing error:', error);
      const detailedError = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      alert(`${t('printError') || 'Failed to print receipt'}:\n${detailedError}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (step === 'selection') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t('paymentMethod') || 'Select Payment Method'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleMethodSelect('cash')}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center p-8 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <svg className="w-12 h-12 text-slate-400 group-hover:text-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold text-lg text-slate-700 group-hover:text-primary">{t('cash') || 'Cash'}</span>
            </button>

            <button
              onClick={() => handleMethodSelect('card')}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <svg className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-semibold text-lg text-slate-700 group-hover:text-blue-500">{t('card') || 'Card'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'cash_input') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('amountTendered') || 'Amount Tendered'}</h2>
          <p className="text-slate-500 mb-6">{t('totalAmount') || 'Total Amount'}: <span className="text-primary font-bold text-lg">{total.toFixed(2)} TL</span></p>

          <div className="mb-6">
            <input
              type="number"
              step="0.01"
              autoFocus
              className="w-full text-3xl font-bold p-4 text-center border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-none"
              placeholder={total.toFixed(2)}
              value={tenderedAmount}
              onChange={(e) => setTenderedAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCashConfirm()}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('selection')}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              {t('cancel') || 'Back'}
            </button>
            <button
              onClick={handleCashConfirm}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
              {isProcessing ? t('processing') : (t('complete') || 'Complete')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'summary') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('orderCompleted') || 'Order Completed!'}</h2>
          
          {paymentMethod === 'cash' && change > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-slate-500 text-sm mb-1">{t('changeDue') || 'Change Due'}</p>
              <p className="text-3xl font-bold text-green-600">{change.toFixed(2)} TL</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handlePrint}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t('printReceipt') || 'Print Receipt'}
            </button>
            
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
              {t('newOrder') || 'New Order'}
            </button>
          </div>

          {/* Printable Receipt Area */}
          <div className="print-area text-left">
               <div className="text-center mb-6">
                   <h1 className="text-2xl font-bold uppercase tracking-wider border-b-2 border-black pb-2 mb-2">Boss POS</h1>
                   <p className="text-sm">{new Date().toLocaleString()}</p>
                   <p className="text-sm">Order #{Math.floor(Date.now() / 1000).toString().slice(-6)}</p>
               </div>
               
               <div className="mb-6">
                   <table className="w-full text-sm">
                       <thead>
                           <tr className="border-b border-black">
                               <th className="text-left py-1">Item</th>
                               <th className="text-center py-1">Qty</th>
                               <th className="text-right py-1">Price</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200">
                           {(items || []).map((item, idx) => (
                               <tr key={idx}>
                                   <td className="py-2">
                                       <div className="font-medium">{item.name}</div>
                                       {item.options && item.options.length > 0 && (
                                           <div className="text-xs text-gray-500">
                                               {item.options.map(opt => `${opt.name}`).join(', ')}
                                           </div>
                                       )}
                                   </td>
                                   <td className="text-center py-2">{item.quantity}</td>
                                   <td className="text-right py-2">{((item.unitPrice + (item.options?.reduce((a,b)=>a+(b.price||0),0)||0)) * item.quantity).toFixed(2)} TL</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
               
               <div className="border-t-2 border-black pt-4 mb-8">
                   <div className="flex justify-between text-lg font-bold mb-2">
                       <span>Total</span>
                       <span>{total.toFixed(2)} TL</span>
                   </div>
                   <div className="flex justify-between text-sm mb-1">
                       <span>Payment ({paymentMethod})</span>
                       <span>{(paymentMethod === 'cash' ? (parseFloat(tenderedAmount)||total) : total).toFixed(2)} TL</span>
                   </div>
                   {paymentMethod === 'cash' && change > 0 && (
                       <div className="flex justify-between text-sm">
                           <span>Change</span>
                           <span>{change.toFixed(2)} TL</span>
                       </div>
                   )}
               </div>
               
               <div className="text-center text-sm">
                   <p className="font-medium mb-1">Thank You!</p>
                   <p>Please come again.</p>
               </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentModal;
