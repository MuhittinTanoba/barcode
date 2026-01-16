'use client'
import React, { useState } from 'react';
import axios from 'axios';
import appConfig from '../../config';
import QuickRegisterModal from '../Customer/QuickRegisterModal';
import CampaignSelector from '../Customer/CampaignSelector';

const PaymentPage = ({ order, onClose, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [cardProcessingStep, setCardProcessingStep] = useState('');
  
  // Customer loyalty state
  const [customer, setCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [pointsToEarn, setPointsToEarn] = useState(0);
  
  // Points usage state
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  // New Features State: Coupons & Split Bill
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitCount, setSplitCount] = useState(2); // Default 2 people
  const [splitAmount, setSplitAmount] = useState(0); // If custom split
  const [splitIndex, setSplitIndex] = useState(1); // Tracking which split part is paying
  
  // Split by Item State
  const [isSplitByItemMode, setIsSplitByItemMode] = useState(false);
  const [selectedSplitItems, setSelectedSplitItems] = useState({}); // { [itemIndex]: quantity }
  
  // Local order state to handle partial updates without closing modal
  const [activeOrder, setActiveOrder] = useState(order);
  const [orderNote, setOrderNote] = useState(order.description || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Sync prop 'order' to 'activeOrder' if prop changes (optional but good for consistency)
  React.useEffect(() => {
    setActiveOrder(order);
  }, [order]);
  
  // Points calculation functions
  const calculatePointsValue = (points) => {
    // 100 points = $1 (1 point = $0.01)
    return points * 0.01;
  };

  const calculateMaxUsablePoints = () => {
    if (!customer || !customer.points) return 0;
    const maxPoints = Math.floor(customer.points);
    const maxValue = calculatePointsValue(maxPoints);
    const orderTotal = order.totalAmount || 0;
    
    // Can't use more points than the order total
    const maxUsablePoints = Math.min(maxPoints, Math.floor(orderTotal * 100));
    return maxUsablePoints;
  };

  const handleUseAllPoints = () => {
    const maxPoints = calculateMaxUsablePoints();
    setPointsToUse(maxPoints);
    setPointsDiscount(calculatePointsValue(maxPoints));
  };

  const handlePointsChange = (value) => {
    const points = Math.min(parseInt(value) || 0, calculateMaxUsablePoints());
    setPointsToUse(points);
    setPointsDiscount(calculatePointsValue(points));
  };

  // Helper function to parse EMV XML response
  const parseEMVResponse = (xmlText) => {
    try {
      // Simple regex-based parsing for key fields
      const cmdStatus = xmlText.match(/<CmdStatus>([^<]+)<\/CmdStatus>/)?.[1];
      const authCode = xmlText.match(/<AuthCode>([^<]+)<\/AuthCode>/)?.[1];
      const refNo = xmlText.match(/<RefNo>([^<]+)<\/RefNo>/)?.[1];
      const acctNo = xmlText.match(/<AcctNo>([^<]+)<\/AcctNo>/)?.[1];
      const cardType = xmlText.match(/<CardType>([^<]+)<\/CardType>/)?.[1];
      const textResponse = xmlText.match(/<TextResponse>([^<]+)<\/TextResponse>/)?.[1];
      
      return {
        cmdStatus,
        authCode,
        refNo,
        acctNo: acctNo ? acctNo.replace(/\*/g, '') : null, // Remove asterisks from masked account
        cardType,
        textResponse
      };
    } catch (error) {
      console.error('Error parsing EMV response:', error);
      return null;
    }
  };
  
  // Tip state'i - custom tip ve percentage tip
  const [customTip, setCustomTip] = useState('');
  const [tipPercentage, setTipPercentage] = useState('');
  const [tipType, setTipType] = useState('custom'); // 'custom' or 'percentage'

  const subtotal = activeOrder.totalAmount || 0;

  const calculateCampaignDiscount = (campaign, amount) => {
    switch (campaign.type) {
      case 'discount_percentage':
        return (amount * campaign.value) / 100;
      case 'discount_fixed':
        return Math.min(campaign.value, amount);
      default:
        return 0;
    }
  };

  // Calculate tip based on type
  let tipValue = 0;
  if (tipType === 'custom') {
    tipValue = parseFloat(customTip) || 0;
  } else if (tipType === 'percentage') {
    const percentage = parseFloat(tipPercentage) || 0;
    tipValue = (subtotal * percentage) / 100;
  }
  
// Kampanya indirimi hesapla (Hem kampanya hem yeni kupon sistemi)
const campaignDiscount = selectedCampaign ? calculateCampaignDiscount(selectedCampaign, subtotal + tipValue) : 0;
const couponDiscountVal = appliedCoupon ? appliedCoupon.discountAmount : 0;

// Toplam tutar hesapla
const totalDiscount = campaignDiscount + couponDiscountVal + pointsDiscount;
const calculatedTotal = (subtotal + tipValue) - totalDiscount;
const totalAmount = Math.max(0, calculatedTotal);

// Split Bill Logic
const remainingAmount = activeOrder.remainingAmount !== undefined ? activeOrder.remainingAmount : totalAmount;
const isPartiallyPaid = activeOrder.paymentStatus === 'partially_paid';



// Helper to calculate price of a single item including options
const calculateItemPrice = (item) => {
    const itemTotal = (item.unitPrice || 0);
    const optionsArray = Array.isArray(item.options) ? item.options : [];
    const optionsTotal = optionsArray.reduce((sum, option) => sum + (option.price || 0), 0);
    return itemTotal + optionsTotal;
};

// Calculate total for selected split items
const selectedItemsTotal = Object.entries(selectedSplitItems).reduce((sum, [index, quantity]) => {
    const item = activeOrder.items[parseInt(index)];
    if (!item) return sum;
    return sum + (calculateItemPrice(item) * quantity);
}, 0);

// If splitting by N people
const perPersonAmount = isSplitMode ? (totalAmount / splitCount) : 0;

// Determine exact amount to pay right now based on mode

let paymentDueAmount = remainingAmount;

if (isSplitMode) {
    if (isSplitByItemMode) {
        paymentDueAmount = selectedItemsTotal;
    } else if (splitAmount > 0) {
        paymentDueAmount = parseFloat(splitAmount);
    } else {
        paymentDueAmount = perPersonAmount;
    }
} else if (isPartiallyPaid) {
    paymentDueAmount = remainingAmount;
} else {
    // Standard full payment
    paymentDueAmount = totalAmount; 
}

  const change = amountReceived ? (parseFloat(amountReceived) - paymentDueAmount) : 0;

  // Calculate points to earn
  React.useEffect(() => {
    if (customer && totalAmount > 0) {
      const basePoints = Math.floor(totalAmount / appConfig.pointsConfig.amountPerPoint);
      const tierMultiplier = customer.tier === 'platinum' ? 2 : 
                            customer.tier === 'gold' ? 1.5 : 
                            customer.tier === 'silver' ? 1.25 : 1;
      setPointsToEarn(Math.floor(basePoints * tierMultiplier));
    }
  }, [customer, totalAmount]);

  const handleCustomTipChange = (value) => {
    setCustomTip(value);
    setTipType('custom');
  };

  const handlePercentageTipChange = (percentage) => {
    setTipPercentage(percentage);
    setTipType('percentage');
    setCustomTip(''); // Clear custom tip when using percentage
  };

  const handleQuickTipClick = (percentage) => {
    setTipPercentage(percentage.toString());
    setTipType('percentage');
    setCustomTip(''); // Clear custom tip when using percentage
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      const res = await axios.get(`/api/coupons?code=${couponCode}&amount=${subtotal}`);
      if (res.data.valid) {
        setAppliedCoupon(res.data.coupon);
        setCouponCode('');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // Customer loyalty functions
  const handleCustomerLookup = async () => {
    if (!customerPhone.trim()) return;
    
    try {
      const response = await axios.get(`${appConfig.customerApiUrl}/phone/${customerPhone}`);
      const found = response.data.customer;
      setCustomer(found);
      // Persist selected customer on the order immediately to avoid missing points later
      if (activeOrder?._id && found?._id) {
        try {
          await axios.put(`${appConfig.orderApiUrl}/${activeOrder._id}`, {
            customerId: found._id
          });
        } catch (e) {
          console.error('Failed to attach customer to order:', e);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setShowCustomerModal(true);
      } else {
        console.error('Error looking up customer:', error);
      }
    }
  };

  const handleCustomerRegistered = (newCustomer) => {
    setCustomer(newCustomer);
    setShowCustomerModal(false);
    // Persist newly registered customer on the order
    if (activeOrder?._id && newCustomer?._id) {
      (async () => {
        try {
          await axios.put(`${appConfig.orderApiUrl}/${activeOrder._id}`, {
            customerId: newCustomer._id
          });
        } catch (e) {
          console.error('Failed to attach newly registered customer to order:', e);
        }
      })();
    }
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignModal(false);
  };

  const handleRemoveCustomer = () => {
    setCustomer(null);
    setSelectedCampaign(null);
    setCustomerPhone('');
    // Detach customer from order to keep backend consistent
    if (activeOrder?._id) {
      (async () => {
        try {
          await axios.put(`${appConfig.orderApiUrl}/${activeOrder._id}`, {
            customerId: null
          });
        } catch (e) {
          console.error('Failed to detach customer from order:', e);
        }
      })();
    }
  };

  const handlePayment = async () => {
    // Determine amount to pay locally to ensure freshness
    // Uses component level paymentDueAmount which updates on render
    const currentDueAmount = paymentDueAmount;

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (isSplitMode && isSplitByItemMode && currentDueAmount <= 0) {
        setError('Please select items to pay first');
        return;
    }

    if (paymentMethod === 'cash') {
        const received = parseFloat(amountReceived) || 0;
        if (received < (currentDueAmount - 0.01)) {
           setError(`Insufficient Payment: Received ${formatCurrency(received)}, Needed ${formatCurrency(currentDueAmount)}`);
           return;
        }
    }

    // Use points if customer is using them
    if (usePoints && pointsToUse > 0 && customer) {
      try {
        await axios.post(`${appConfig.customerApiUrl}/${customer._id}/points/redeem`, {
          points: pointsToUse,
          orderId: activeOrder._id,
          description: `Points redeemed for order #${activeOrder.orderNumber || activeOrder._id}`
        });
      } catch (error) {
        console.error('Error redeeming points:', error);
        setError('Failed to redeem points. Please try again.');
        return;
      }
    }

    setIsProcessing(true);
    setError(null);

    try {
      // amountToPayNow is already calculated above

      // Prepare payment data
      const paymentInfo = {
        orderId: activeOrder._id,
        paymentMethod: paymentMethod,
        subtotal: subtotal,
        tipAmount: tipValue,
        totalAmount: totalAmount, // Full total
        amountPaid: currentDueAmount, // Send the exact due amount, not the cash received
        change: paymentMethod === 'cash' ? change : 0,
        status: 'paid', // Optimistic, API will decide
        customerId: customer?._id,
        pointsEarned: pointsToEarn,
        campaignApplied: selectedCampaign?._id,
        discountAmount: selectedCampaign ? calculateCampaignDiscount(selectedCampaign, totalAmount) : 0,
        pointsDiscount: pointsDiscount // Add points discount to payment data
      };

      // Add Split Items to payload if in that mode
      if (isSplitMode && isSplitByItemMode) {
          paymentInfo.items = Object.entries(selectedSplitItems).map(([index, quantity]) => {
              const item = activeOrder.items[parseInt(index)];
              return {
                  productId: item.productId?._id || item.productId, // Handle populated object or raw ID
                  name: item.name, // Add name for fallback matching
                  quantity: quantity,
                  options: item.options,
                  itemId: item._id // Will be undefined if _id: false in schema, but good to have if changed later
              };
          });
      }

      // Add Coupon info
      if (appliedCoupon) {
        paymentInfo.couponCode = appliedCoupon.code;
        paymentInfo.couponDiscount = appliedCoupon.discountAmount;
      }

      // If card selected, send EMV request via our backend to handle SequenceNo logic
      if (paymentMethod === 'card') {
        setCardProcessingStep('Processing card transaction...');
        
        const invoice = (activeOrder._id || '').toString().slice(-4).padStart(4, '0');
        const purchase = (totalAmount - tipValue).toFixed(2);
        const gratuity = tipValue > 0 ? tipValue.toFixed(2) : null;

        const amountData = {
            Purchase: purchase
        };
        if (gratuity) {
             amountData.Gratuity = gratuity;
        }

        // Call our backend API
        const response = await axios.post('/api/card-operations', {
            action: 'EMVSale',
            extraData: {
                CardType: 'Credit',
                InvoiceNo: invoice,
                RefNo: invoice,
                UserTrace: `order:${activeOrder._id}`,
                orderId: activeOrder._id, // Explicitly link orderId for CardTransaction
                Amount: amountData
            }
        });

        console.log('EMVSale Response:', response.data); // DEBUG Log

        if (!response.data.success) {
            const rStream = response.data.data;
            const textResponse = rStream?.TextResponse;
            const errorMsg = textResponse 
                ? `Transaction Failed: ${textResponse}` 
                : (response.data.message || response.data.error || 'Card transaction failed');
             throw new Error(errorMsg);
        }

        const emvData = response.data.data; // This is the RStream object from backend
        
        // Check if transaction was approved
        if (emvData.CmdStatus !== 'Approved' && emvData.CmdStatus !== 'Success') {
             throw new Error(`Card transaction declined: ${emvData.TextResponse || 'Unknown Issue'}`);
        }

        // Store EMV transaction details
        if (emvData.TextResponse) {
            paymentInfo.textResponse = emvData.TextResponse;
        }
        if (emvData.AuthCode) {
          paymentInfo.authCode = emvData.AuthCode;
        }
        if (emvData.RefNo) {
          paymentInfo.refNo = emvData.RefNo;
        }
        if (emvData.CardType) {
          paymentInfo.cardType = emvData.CardType;
        }
        if (emvData.AcctNo) {
          paymentInfo.maskedAccount = emvData.AcctNo;
        }
        
        // Capture transaction ID from the successful response (it's returned by our backend wrapper)
        if (response.data.transactionId) {
            console.log('Captured transactionId:', response.data.transactionId);
            paymentInfo.transactionId = response.data.transactionId;
        } else {
            console.error('WARNING: transactionId missing in response data!');
        }
        
        console.log('Card transaction approved successfully:', emvData);
      }

      // Update order status to paid only after successful payment
      // Update order with new ADD PAYMENT logic
      const updatePayload = {
        addPayment: {
            method: paymentMethod,
            amount: paymentInfo.amountPaid,
            processedBy: null, // TODO: Add current user ID
            items: paymentInfo.items // Pass split items (if any) to backend
        },
        // Always send total fields to keep sync
        subtotal: subtotal,
        tipAmount: tipValue,
        totalAmount: totalAmount, 
        
        customerId: paymentInfo.customerId,
        pointsEarned: paymentInfo.pointsEarned,
        campaignApplied: paymentInfo.campaignApplied,
        discountAmount: paymentInfo.discountAmount,
        
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        couponDiscount: appliedCoupon ? appliedCoupon.discountAmount : 0
      };

      if (paymentInfo.transactionId) {
          updatePayload.addPayment.transactionId = paymentInfo.transactionId;
      }

      if (paymentInfo.amountPaid >= remainingAmount - 0.01) {
          updatePayload.status = 'paid';
          updatePayload.paymentStatus = 'paid';
      }

      await axios.put(`${appConfig.orderApiUrl}/${activeOrder._id}`, updatePayload);
      
      // Update table status
      if (activeOrder.tableId) {
        await axios.put(`${appConfig.tableApiUrl}/${activeOrder.tableId._id}`, {
          status: 'available'
        });
      }

      // Show payment summary
      setPaymentData(paymentInfo);
      setShowSummary(true);
      
    } catch (err) {
      console.error('Payment error:', err);
      
      // Show more specific error messages for card transactions
      if (paymentMethod === 'card') {
        // Just use the message as is since we formatted it above
        setError(err.message);
      } else {
        setError('Payment failed');
      }
    } finally {
      setIsProcessing(false);
      setCardProcessingStep('');
    }
  };

  const handlePrintReceipt = async () => {
    setIsPrinting(true);
    try {
      // Optimized: Just send ID, let backend fetch details
      await axios.post(appConfig.printReceiptApiUrl, { orderId: activeOrder._id });
      console.log('Receipt print command sent successfully');
    } catch (error) {
      console.error('Failed to print receipt:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCloseSummary = async () => {
    setShowSummary(false);
    setPaymentData(null);
    setAmountReceived(''); // Reset inputs
    setSelectedSplitItems({}); // Reset split selection
    
    // Refresh order data first
    try {
        const res = await axios.get(`${appConfig.orderApiUrl}/${activeOrder._id}`);
        const updatedOrder = res.data;
        
        // Update local state to reflect new remaining amount and paid items
        setActiveOrder(updatedOrder);

        // If order is fully paid, close the modal
        if (updatedOrder.paymentStatus === 'paid' || updatedOrder.remainingAmount <= 0.01) {
            onPaymentComplete();
        } 
        // Else: stay open, updatedOrder is now serving as the source of truth for rendering
    } catch (e) {
        console.error('Error refreshing order:', e);
        onPaymentComplete(); // Fallback if we can't refresh
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const handleSaveNote = async () => {
      setIsSavingNote(true);
      try {
          await axios.put(`${appConfig.orderApiUrl}/${activeOrder._id}`, {
              description: orderNote
          });
          // Update local activeOrder
          setActiveOrder(prev => ({ ...prev, description: orderNote }));
      } catch (error) {
          console.error('Failed to save order note:', error);
      } finally {
          setIsSavingNote(false);
      }
  };

  // Payment Summary Screen
  if (showSummary && paymentData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-border">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground">
              {paymentData.textResponse || (paymentData.paymentMethod === 'card' 
                ? 'Card transaction approved and order completed successfully!' 
                : 'Order has been completed successfully')
              }
            </p>
          </div>

          {/* Payment Summary */}
          <div className="bg-muted/50 p-4 rounded-lg mb-6 border border-border">
            <h3 className="font-semibold mb-3 text-foreground">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono text-foreground">{order._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Table:</span>
                <span className="text-foreground">Table {order.tableId?.number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="capitalize text-foreground font-medium">{paymentData.paymentMethod}</span>
              </div>
              {paymentData.authCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auth Code:</span>
                  <span className="font-mono text-foreground">{paymentData.authCode}</span>
                </div>
              )}
              {paymentData.refNo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference No:</span>
                  <span className="font-mono text-foreground">{paymentData.refNo}</span>
                </div>
              )}
              {paymentData.cardType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card Type:</span>
                  <span className="text-foreground">{paymentData.cardType}</span>
                </div>
              )}
              {paymentData.maskedAccount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card:</span>
                  <span className="font-mono text-foreground">****{paymentData.maskedAccount.slice(-4)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground">{formatCurrency(paymentData.subtotal)}</span>
              </div>
              {/* Discounts */}
              {paymentData.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Campaign Discount:</span>
                  <span>-{formatCurrency(paymentData.discountAmount)}</span>
                </div>
              )}
              {paymentData.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon Discount ({paymentData.couponCode}):</span>
                  <span>-{formatCurrency(paymentData.couponDiscount)}</span>
                </div>
              )}
              {paymentData.pointsDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Points Discount:</span>
                  <span>-{formatCurrency(paymentData.pointsDiscount)}</span>
                </div>
              )}
              
              {paymentData.tipAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip:</span>
                  <span className="text-accent font-semibold">{formatCurrency(paymentData.tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total Amount:</span>
                <span className="font-semibold text-primary">{formatCurrency(paymentData.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold text-foreground">{formatCurrency(paymentData.amountPaid)}</span>
              </div>
              
              {/* Show Remaining Amount if partial. */}
               {(activeOrder.remainingAmount !== undefined || activeOrder.totalAmount) && ((activeOrder.remainingAmount !== undefined ? activeOrder.remainingAmount : activeOrder.totalAmount) - paymentData.amountPaid) > 0.01 && (
                <div className="flex justify-between border-t border-dashed border-border pt-2 mt-2">
                    <span className="font-semibold text-orange-600">Remaining Balance:</span>
                    <span className="font-bold text-orange-600">
                         {formatCurrency(Math.max(0, (activeOrder.remainingAmount !== undefined ? activeOrder.remainingAmount : activeOrder.totalAmount) - paymentData.amountPaid))}
                    </span>
                </div>
              )}
              {paymentData.change > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change:</span>
                  <span className="text-accent font-semibold">{formatCurrency(paymentData.change)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePrintReceipt}
              disabled={isPrinting}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                isPrinting ? 'bg-muted cursor-not-allowed text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
              }`}
            >
              {isPrinting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Printing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </>
              )}
            </button>
            
            <button
              onClick={handleCloseSummary}
              className="w-full py-3 rounded-lg font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original Payment Form
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Payment</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Column - Customer & Order Info */}
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2">
            {/* Customer Loyalty Section */}
            <div>
          <h3 className="font-semibold mb-3 text-foreground">Customer Information</h3>
          {customer ? (
            <div className="bg-secondary/30 p-4 rounded-lg border border-secondary">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  <p className="text-sm text-muted-foreground">Points: {customer.points} | Tier: {customer.tier}</p>
                  {pointsToEarn > 0 && (
                    <p className="text-sm text-accent font-medium mt-1">Will earn: {pointsToEarn} points</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-lg hover:bg-accent/90 transition-colors font-medium"
                  >
                    Campaigns
                  </button>
                  <button
                    onClick={handleRemoveCustomer}
                    className="px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded-lg hover:bg-destructive/90 transition-colors font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {selectedCampaign && (
                <div className="mt-2 p-2 bg-accent/10 rounded border border-accent/20">
                  <p className="text-sm text-accent font-medium">
                    Campaign: {selectedCampaign.name}
                  </p>
                </div>
              )}
              
              {/* Points Usage Button */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (usePoints) {
                      setUsePoints(false);
                      setPointsToUse(0);
                      setPointsDiscount(0);
                    } else {
                      setUsePoints(true);
                      handleUseAllPoints();
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                    usePoints 
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                      : 'bg-accent text-accent-foreground hover:bg-accent/90'
                  }`}
                >
                  {usePoints ? 'Remove Points' : 'Use Points'}
                </button>
                {usePoints && (
                  <div className="text-xs text-accent mt-1 font-medium">
                    Using {pointsToUse} points (${pointsDiscount.toFixed(2)} discount)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="flex-1 p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                />
                <button
                  onClick={handleCustomerLookup}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Lookup
                </button>
              </div>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full py-2 px-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
              >
                Register New Customer
              </button>
            </div>
          )}
            </div>

            {/* Order Details */}
            <div>
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-foreground">{order.orderType === 'to_go' ? 'To-Go' : `Table ${order.tableId?.number || 'N/A'}`}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString('en-US')}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              {order.items?.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{item?.title || item?.name || 'Unknown Product'} x {item.quantity}</span>
                    <span className="text-foreground font-medium">{formatCurrency((item?.unitPrice || 0) * item.quantity)}</span>
                  </div>
                  {item.description && (
                    <div className="text-xs text-accent italic ml-2 bg-secondary/20 px-2 py-0.5 rounded">
                      Note: {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedCampaign && campaignDiscount > 0 && (
  <div className="flex justify-between text-sm text-accent font-medium mb-2">
    <span>Campaign Discount ({selectedCampaign.name}):</span>
    <span>-{formatCurrency(campaignDiscount)}</span>
  </div>
)}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {tipValue > 0 && (
                <div className="flex justify-between text-sm text-accent">
                  <span>Tip:</span>
                  <span className="font-semibold">{formatCurrency(tipValue)}</span>
                </div>
              )}
              {campaignDiscount > 0 && (
                <div className="flex justify-between text-sm text-accent">
                  <span>Campaign Discount:</span>
                  <span className="font-semibold">-{formatCurrency(campaignDiscount)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm text-accent">
                  <span>Points Discount:</span>
                  <span className="font-semibold">-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-border pt-2 mt-2">
                <span className="text-foreground">TOTAL</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
               {isPartiallyPaid && remainingAmount > 0.01 && (
                <div className="flex justify-between font-bold text-md text-orange-600 mt-1">
                  <span>Remaining</span>
                  <span>{formatCurrency(remainingAmount)}</span>
                </div>
              )}
            </div>
          </div>
           {/* Order Note Section */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border mt-4">
                <label className="block text-sm font-semibold text-foreground mb-2">Order Note (To-Go / Kitchen)</label>
                <div className="flex gap-2">
                    <textarea 
                        className="flex-1 p-2 text-sm border border-input rounded resize-y min-h-[60px]"
                        placeholder="Add note here (e.g. No cutlery, Door code...)"
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                    ></textarea>
                </div>
                <div className="mt-2 text-right">
                     <button 
                        onClick={handleSaveNote}
                        disabled={isSavingNote || orderNote === activeOrder.description}
                        className={`px-3 py-1 text-xs rounded font-bold transition-colors ${
                            isSavingNote || orderNote === activeOrder.description 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                     >
                         {isSavingNote ? 'Saving...' : 'Save Note'}
                     </button>
                </div>
            </div>
            </div>
          </div>

          {/* Right Column - Payment Methods */}
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pl-2">
            {/* Tip Section - Simplified */}
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Tip</h3>
              
              {/* Quick Tip Buttons */}
              <div className="mb-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickTipClick(15)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      tipType === 'percentage' && tipPercentage === '15'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    }`}
                  >
                    15%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTipClick(18)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      tipType === 'percentage' && tipPercentage === '18'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    }`}
                  >
                    18%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTipClick(20)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      tipType === 'percentage' && tipPercentage === '20'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    }`}
                  >
                    20%
                  </button>
                </div>
              </div>

              {/* Custom Tip Input */}
              <div className="mb-2">
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => handleCustomTipChange(e.target.value)}
                  placeholder="Custom tip"
                  step="0.01"
                  min="0"
                  className="w-full p-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                />
              </div>

              {/* Tip Summary - Compact */}
              {tipValue > 0 && (
                <div className="p-2 bg-accent/10 rounded-lg text-xs border border-accent/20">
                  <div className="flex justify-between">
                    <span className="text-accent font-medium">Tip:</span>
                    <span className="font-semibold text-accent">
                      {formatCurrency(tipValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Coupon Code Section */}
            <div className="mt-4">
              <h3 className="font-semibold mb-3 text-foreground">Discount Coupon</h3>
              {appliedCoupon ? (
                <div className="bg-green-100 p-3 rounded-lg border border-green-200 flex justify-between items-center">
                   <div>
                     <p className="font-bold text-green-700">{appliedCoupon.code}</p>
                     <p className="text-xs text-green-600">-${formatCurrency(appliedCoupon.discountAmount)}</p>
                   </div>
                   <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Code"
                    className="flex-1 p-2 border border-input rounded-lg uppercase"
                  />
                  <button onClick={handleApplyCoupon} className="bg-accent text-accent-foreground px-4 rounded-lg font-medium">Apply</button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
            </div>

            {/* Split Bill Toggle */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">Split Bill</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isSplitMode} onChange={() => {
                          setIsSplitMode(!isSplitMode);
                          setIsSplitByItemMode(false); // Reset sub-mode
                          setSplitCount(2);
                      }} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                </div>
                
                {isSplitMode && (
                    <div className="bg-muted p-3 rounded-lg space-y-3">
                        {/* Split Type Selector */}
                        <div className="flex bg-white rounded-lg p-1 border mb-3">
                            <button 
                                onClick={() => setIsSplitByItemMode(false)}
                                className={`flex-1 py-1 text-sm font-medium rounded ${!isSplitByItemMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                            >
                                By Person / Amount
                            </button>
                            <button 
                                onClick={() => setIsSplitByItemMode(true)}
                                className={`flex-1 py-1 text-sm font-medium rounded ${isSplitByItemMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                            >
                                By Item
                            </button>
                        </div>

                        {!isSplitByItemMode ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Split by person:</span>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-8 h-8 rounded bg-white border flex items-center justify-center">-</button>
                                        <span className="font-bold w-4 text-center">{splitCount}</span>
                                        <button onClick={() => setSplitCount(splitCount + 1)} className="w-8 h-8 rounded bg-white border flex items-center justify-center">+</button>
                                    </div>
                                </div>
                                <div className="text-center p-2 bg-white rounded border">
                                    <span className="text-xs text-muted-foreground">Each person pays:</span>
                                    <div className="font-bold text-lg text-primary">{formatCurrency(totalAmount / splitCount)}</div>
                                </div>
                                <div className="pt-2 border-t">
                                    <span className="text-sm block mb-1">Or enter custom amount:</span>
                                    <input 
                                        type="number" 
                                        value={splitAmount} 
                                        onChange={(e) => setSplitAmount(e.target.value)}
                                        placeholder="Custom amount"
                                        className="w-full p-2 text-sm border rounded"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                    {activeOrder.items.map((item, idx) => {
                                        const paidCount = item.paidQuantity || 0;
                                        const availableCount = item.quantity - paidCount;
                                        const isFullyPaid = availableCount <= 0;
                                        const selectedQty = selectedSplitItems[idx] || 0;
                                        
                                        if (isFullyPaid) return null;

                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded border bg-white">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium leading-none">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">{formatCurrency(calculateItemPrice(item))} ea</div>
                                                    {paidCount > 0 && <div className="text-[10px] text-orange-600 font-semibold">Paid: {paidCount}/{item.quantity}</div>}
                                                </div>
                                                
                                                {(
                                                availableCount > 1 ? (
                                                    <div className="flex items-center space-x-2">
                                                        <button 
                                                            onClick={() => setSelectedSplitItems(prev => ({ ...prev, [idx]: Math.max(0, (prev[idx] || 0) - 1) }))}
                                                            className="w-6 h-6 rounded bg-muted flex items-center justify-center text-sm"
                                                        >-</button>
                                                        <span className="w-4 text-center text-sm font-bold">{selectedQty}</span>
                                                        <button 
                                                            onClick={() => setSelectedSplitItems(prev => ({ ...prev, [idx]: Math.min(availableCount, (prev[idx] || 0) + 1) }))}
                                                            className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm"
                                                        >+</button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center space-x-2">
                                                      <input 
                                                          type="checkbox" 
                                                          checked={!!selectedSplitItems[idx]} 
                                                          onChange={(e) => {
                                                              const newState = { ...selectedSplitItems };
                                                              if (e.target.checked) newState[idx] = 1;
                                                              else delete newState[idx];
                                                              setSelectedSplitItems(newState);
                                                          }}
                                                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                      />
                                                      <span className="text-sm">Pay</span>
                                                    </label>
                                                ))}

                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-center p-2 bg-white rounded border border-primary/20 bg-primary/5">
                                    <span className="text-xs text-muted-foreground">Selected Total:</span>
                                    <div className="font-bold text-lg text-primary">{formatCurrency(selectedItemsTotal)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Method */}
            <div>
          <h3 className="font-semibold mb-3 text-foreground">Payment Method</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-foreground font-medium">Cash</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-foreground font-medium">Card</span>
            </label>
          </div>
          
          {/* Card payment info */}
          {paymentMethod === 'card' && (
            <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center text-sm text-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Card payment requires approval. Please insert/swipe your card when prompted.
              </div>
            </div>
          )}
            </div>

            {/* Cash Payment Field */}
            {paymentMethod === 'cash' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Amount Received
            </label>
            <input
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="0.00"
              step="0.01"

              min="0" // Allow any amount, validation handles the logic
              max={paymentDueAmount + 1000} // Reasonable upper limit
              className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
            />
            {amountReceived && (
              <div className="mt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change:</span>
                  <span className={`font-semibold ${change >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}
            </div>
            )}

            {/* Error Message */}
            {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            {error}
          </div>
            )}

            {/* Payment Button */}
            <button
          onClick={handlePayment}
          disabled={isProcessing || !paymentMethod || (paymentMethod === 'cash' && !amountReceived)}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            isProcessing || !paymentMethod || (paymentMethod === 'cash' && !amountReceived)
              ? 'bg-muted cursor-not-allowed text-muted-foreground'
              : 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{paymentMethod === 'card' ? cardProcessingStep || 'Processing Card...' : 'Processing...'}</span>
            </div>
          ) : (
            `Pay ${formatCurrency(paymentDueAmount)}`
          )}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Registration Modal */}
      {showCustomerModal && (
        <QuickRegisterModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onCustomerRegistered={handleCustomerRegistered}
        />
      )}

      {/* Campaign Selection Modal */}
      {showCampaignModal && customer && (
        <CampaignSelector
          isOpen={showCampaignModal}
          onClose={() => setShowCampaignModal(false)}
          onCampaignSelect={handleCampaignSelect}
          customer={customer}
          orderAmount={totalAmount}
        />
      )}
    </div>
  );
};

export default PaymentPage; 