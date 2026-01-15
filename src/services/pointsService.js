import Customer from '../models/Customer.js';
import CustomerTransaction from '../models/CustomerTransaction.js';

// Point calculation configuration
const POINTS_CONFIG = {
  amountPerPoint: 10, // $10 = 1 point
  tierMultipliers: {
    bronze: 1,
    silver: 1.25,
    gold: 1.5,
    platinum: 2
  },
  birthdayMultiplier: 2
};

/**
 * Calculate points earned based on order amount and customer tier
 * @param {number} amount - Order amount in USD
 * @param {Object} customer - Customer object with tier and birthday info
 * @returns {number} Points to be earned
 */
export const calculatePointsEarned = (amount, customer) => {
  if (!amount || amount <= 0) return 0;
  
  // Base points calculation
  const basePoints = Math.floor(amount / POINTS_CONFIG.amountPerPoint);
  
  // Apply tier multiplier
  const tierMultiplier = POINTS_CONFIG.tierMultipliers[customer?.tier] || 1;
  let points = Math.floor(basePoints * tierMultiplier);
  
  // Apply birthday bonus if it's the customer's birthday month
  if (customer?.birthday) {
    const now = new Date();
    const birthday = new Date(customer.birthday);
    if (now.getMonth() === birthday.getMonth()) {
      points = Math.floor(points * POINTS_CONFIG.birthdayMultiplier);
    }
  }
  
  return points;
};

/**
 * Apply tier multiplier to points
 * @param {number} points - Base points
 * @param {string} tier - Customer tier
 * @returns {number} Points with tier multiplier applied
 */
export const applyTierMultiplier = (points, tier) => {
  const multiplier = POINTS_CONFIG.tierMultipliers[tier] || 1;
  return Math.floor(points * multiplier);
};

/**
 * Calculate customer tier based on total spent
 * @param {number} totalSpent - Total amount spent by customer
 * @returns {string} Customer tier
 */
export const calculateTier = (totalSpent) => {
  if (totalSpent >= 15000) return 'platinum';
  if (totalSpent >= 5001) return 'gold';
  if (totalSpent >= 1001) return 'silver';
  return 'bronze';
};

/**
 * Add points to customer account
 * @param {string} customerId - Customer ID
 * @param {number} points - Points to add
 * @param {string} orderId - Order ID (optional)
 * @param {string} description - Transaction description
 * @returns {Promise<Object>} Updated customer and transaction record
 */
export const addPoints = async (customerId, points, orderId = null, description = 'Points earned from purchase') => {
  try {
    // Update customer points
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { 
        $inc: { points: points },
        $set: { lastVisit: new Date() }
      },
      { new: true }
    );

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create transaction record
    const transaction = new CustomerTransaction({
      customerId,
      orderId,
      type: 'earn',
      points: points,
      description
    });

    await transaction.save();

    return { customer, transaction };
  } catch (error) {
    throw new Error(`Failed to add points: ${error.message}`);
  }
};

/**
 * Redeem points from customer account
 * @param {string} customerId - Customer ID
 * @param {number} points - Points to redeem
 * @param {string} description - Transaction description
 * @returns {Promise<Object>} Updated customer and transaction record
 */
export const redeemPoints = async (customerId, points, description = 'Points redeemed') => {
  try {
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.points < points) {
      throw new Error('Insufficient points balance');
    }

    // Update customer points
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { $inc: { points: -points } },
      { new: true }
    );

    // Create transaction record
    const transaction = new CustomerTransaction({
      customerId,
      type: 'redeem',
      points: -points,
      description
    });

    await transaction.save();

    return { customer: updatedCustomer, transaction };
  } catch (error) {
    throw new Error(`Failed to redeem points: ${error.message}`);
  }
};

/**
 * Update customer statistics after order completion
 * @param {string} customerId - Customer ID
 * @param {number} orderAmount - Order amount
 * @param {number} pointsEarned - Points earned from this order
 * @returns {Promise<Object>} Updated customer
 */
export const updateCustomerStats = async (customerId, orderAmount, pointsEarned = 0) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: { 
          totalSpent: orderAmount,
          visitCount: 1,
          points: pointsEarned
        },
        $set: { lastVisit: new Date() }
      },
      { new: true }
    );

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if tier needs to be updated
    const newTier = calculateTier(customer.totalSpent);
    if (newTier !== customer.tier) {
      customer.tier = newTier;
      await customer.save();
    }

    return customer;
  } catch (error) {
    throw new Error(`Failed to update customer stats: ${error.message}`);
  }
};

/**
 * Get customer point history
 * @param {string} customerId - Customer ID
 * @param {number} limit - Number of transactions to return
 * @returns {Promise<Array>} Array of transactions
 */
export const getCustomerTransactions = async (customerId, limit = 50) => {
  try {
    const transactions = await CustomerTransaction
      .find({ customerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('orderId', 'totalAmount createdAt')
      .populate('campaignId', 'name type');

    return transactions;
  } catch (error) {
    throw new Error(`Failed to get customer transactions: ${error.message}`);
  }
};

export default {
  calculatePointsEarned,
  applyTierMultiplier,
  calculateTier,
  addPoints,
  redeemPoints,
  updateCustomerStats,
  getCustomerTransactions
};

