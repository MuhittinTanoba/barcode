'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';

const CustomerDetails = ({ customer, onClose, onCustomerUpdate }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: customer.name,
    email: customer.email || '',
    birthday: customer.birthday ? new Date(customer.birthday).toISOString().split('T')[0] : '',
    address: customer.address || ''
  });
  const [pointsForm, setPointsForm] = useState({
    points: '',
    description: ''
  });
  const [showPointsForm, setShowPointsForm] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [customer._id]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${appConfig.customerApiUrl}/${customer._id}/transactions`);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${appConfig.customerApiUrl}/${customer._id}`, editForm);
      onCustomerUpdate(response.data.customer);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handlePointsSubmit = async (e) => {
    e.preventDefault();
    try {
      const points = parseInt(pointsForm.points);
      if (points > 0) {
        await axios.post(`${appConfig.customerApiUrl}/${customer._id}/points/add`, {
          points,
          description: pointsForm.description
        });
      } else {
        await axios.post(`${appConfig.customerApiUrl}/${customer._id}/points/redeem`, {
          points: Math.abs(points),
          description: pointsForm.description
        });
      }
      
      // Refresh customer data
      const response = await axios.get(`${appConfig.customerApiUrl}/${customer._id}`);
      onCustomerUpdate(response.data.customer);
      
      setPointsForm({ points: '', description: '' });
      setShowPointsForm(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'silver': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'gold': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'platinum': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Customer Profile</h2>
              <p className="text-muted-foreground text-sm">Manage details and view history</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Details & Points */}
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-accent hover:text-primary font-medium"
                    >
                      Edit Details
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring/20 focus:border-accent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring/20 focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Birthday</label>
                      <input
                        type="date"
                        value={editForm.birthday}
                        onChange={(e) => setEditForm(prev => ({ ...prev, birthday: e.target.value }))}
                        className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring/20 focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring/20 focus:border-accent"
                        rows="3"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 font-medium">Save</button>
                      <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white border border-border text-foreground py-2 rounded-lg hover:bg-muted font-medium">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">{customer.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium text-foreground">{customer.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-foreground">{customer.email || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Birthday</span>
                      <span className="font-medium text-foreground">{customer.birthday ? new Date(customer.birthday).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Address</span>
                      <span className="font-medium text-foreground text-right max-w-[60%] truncate">{customer.address || '-'}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-muted-foreground">Last Visit</span>
                      <span className="font-medium text-foreground">{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Points Card */}
              <div className="bg-gradient-to-br from-secondary to-secondary/50 border border-border rounded-xl p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4">Loyalty Status</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/60 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-accent mb-1 font-medium">Current Points</p>
                    <p className="text-2xl font-bold text-foreground">{customer.points}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-accent mb-1 font-medium">Current Tier</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getTierBadge(customer.tier)}`}>
                      {customer.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-accent mb-1 font-medium">Total Spent</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-accent mb-1 font-medium">Visits</p>
                    <p className="text-lg font-bold text-foreground">{customer.visitCount}</p>
                  </div>
                </div>

                {!showPointsForm ? (
                  <button
                    onClick={() => setShowPointsForm(true)}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-sm transition-all"
                  >
                    Adjust Points
                  </button>
                ) : (
                  <form onSubmit={handlePointsSubmit} className="bg-white p-4 rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Points (+/-)</label>
                        <input
                          type="number"
                          value={pointsForm.points}
                          onChange={(e) => setPointsForm(prev => ({ ...prev, points: e.target.value }))}
                          className="w-full p-2 border border-border rounded-lg text-sm"
                          placeholder="e.g., 100 or -50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Reason</label>
                        <input
                          type="text"
                          value={pointsForm.description}
                          onChange={(e) => setPointsForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full p-2 border border-border rounded-lg text-sm"
                          placeholder="e.g., Bonus or Redemption"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90">Update</button>
                        <button type="button" onClick={() => setShowPointsForm(false)} className="flex-1 bg-muted text-muted-foreground py-1.5 rounded-lg text-sm font-medium hover:bg-muted/80">Cancel</button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column: Transactions */}
            <div className="bg-muted/30 rounded-xl border border-border flex flex-col h-full max-h-[600px]">
              <div className="p-4 border-b border-border bg-white rounded-t-xl">
                <h3 className="font-semibold text-foreground">Transaction History</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div key={transaction._id} className="bg-white p-3 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-foreground">{transaction.description}</span>
                        <span className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                          {transaction.orderId && (
                            <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-foreground">
                              Order #{transaction.orderId._id?.slice(-6)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
