'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount_percentage',
    value: '',
    requiredPoints: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    conditions: {
      minimumOrderAmount: 0,
      specificDays: [],
      maxUsagePerCustomer: 1
    },
    usageLimit: null
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(appConfig.campaignApiUrl);
      setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await axios.put(`${appConfig.campaignApiUrl}/${editingCampaign._id}`, formData);
      } else {
        await axios.post(appConfig.campaignApiUrl, formData);
      }
      
      fetchCampaigns();
      setShowCreateForm(false);
      setEditingCampaign(null);
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      value: campaign.value,
      requiredPoints: campaign.requiredPoints,
      startDate: new Date(campaign.startDate).toISOString().split('T')[0],
      endDate: new Date(campaign.endDate).toISOString().split('T')[0],
      isActive: campaign.isActive,
      conditions: campaign.conditions,
      usageLimit: campaign.usageLimit
    });
    setShowCreateForm(true);
  };

  const handleDelete = (campaignId) => {
    setDeleteConfirmation({ isOpen: true, id: campaignId });
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirmation.id) return;
    try {
      await axios.delete(`${appConfig.campaignApiUrl}/${deleteConfirmation.id}`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    } finally {
      setDeleteConfirmation({ isOpen: false, id: null });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'discount_percentage',
      value: '',
      requiredPoints: 0,
      startDate: '',
      endDate: '',
      isActive: true,
      conditions: {
        minimumOrderAmount: 0,
        specificDays: [],
        maxUsagePerCustomer: 1
      },
      usageLimit: null
    });
  };

  const getCampaignTypeLabel = (type) => {
    switch (type) {
      case 'discount_percentage': return 'Percentage Discount';
      case 'discount_fixed': return 'Fixed Discount';
      case 'free_product': return 'Free Product';
      case 'points_multiplier': return 'Points Multiplier';
      case 'birthday_special': return 'Birthday Special';
      case 'product_buy_x_get_y': return 'Buy X Get Y';
      default: return type;
    }
  };

  const getStatusBadge = (campaign) => {
    const now = new Date();
    if (!campaign.isActive) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">Inactive</span>;
    if (new Date(campaign.startDate) > now) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">Scheduled</span>;
    if (new Date(campaign.endDate) < now) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Expired</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Active</span>;
  };

  const getCampaignTypeIcon = (type) => {
    switch (type) {
      case 'discount_percentage': return 'percent'; // placeholder
      case 'discount_fixed': return 'tag';
      case 'free_product': return 'gift';
      case 'points_multiplier': return 'star';
      default: return 'tag';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Total Campaigns:</span>
          <span className="text-sm font-bold text-foreground">{campaigns.length}</span>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Campaign Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Type & Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {campaigns.map((campaign) => (
              <tr key={campaign._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-bold text-foreground mb-0.5">
                      {campaign.name}
                    </div>
                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                      {campaign.description || 'No description'}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground/70">
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {getCampaignTypeLabel(campaign.type)}
                    </span>
                    <span className="text-xs font-bold text-accent bg-secondary px-2 py-0.5 rounded w-fit">
                      {campaign.type === 'discount_percentage' ? `${campaign.value}% OFF` : 
                       campaign.type === 'discount_fixed' ? `$${campaign.value} OFF` :
                       campaign.type === 'product_buy_x_get_y' ? 
                         `Buy ${campaign.value?.buy || 0} Get ${campaign.value?.get || 0}` :
                       campaign.value}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(campaign)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${Math.min(((campaign.usageCount || 0) / (campaign.usageLimit || 100)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-foreground">
                      {campaign.usageCount || 0} / {campaign.usageLimit || '∞'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="text-muted-foreground hover:text-accent p-1.5 hover:bg-secondary rounded transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(campaign._id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-foreground">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCampaign(null);
                  resetForm();
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Campaign Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                        placeholder="e.g., Summer Sale"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                        rows="2"
                        placeholder="Internal notes about this campaign..."
                      />
                    </div>
                  </div>
                </div>

                {/* Rules Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">Rules & Value</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        required
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all bg-white"
                      >
                        <option value="discount_percentage">Percentage Discount</option>
                        <option value="discount_fixed">Fixed Discount</option>
                        <option value="free_product">Free Product</option>
                        <option value="points_multiplier">Points Multiplier</option>
                        <option value="birthday_special">Birthday Special</option>
                        <option value="product_buy_x_get_y">Buy X Get Y</option>
                      </select>
                    </div>

                    {formData.type === 'product_buy_x_get_y' ? (
                       <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                         <div>
                           <label className="block text-sm font-medium text-foreground mb-1">Product ID *</label>
                           <input
                             type="text"
                             value={formData.value?.productId || ''}
                             onChange={(e) => setFormData(prev => ({
                               ...prev,
                               value: { ...prev.value, productId: e.target.value }
                             }))}
                             required
                             className="w-full p-2.5 border border-border rounded-lg"
                           />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-sm font-medium text-foreground mb-1">Buy Quantity</label>
                             <input
                               type="number"
                               value={formData.value?.buy || ''}
                               onChange={(e) => setFormData(prev => ({
                                 ...prev,
                                 value: { ...prev.value, buy: parseInt(e.target.value) }
                               }))}
                               required
                               min="1"
                               className="w-full p-2.5 border border-border rounded-lg"
                             />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-foreground mb-1">Get Free</label>
                             <input
                               type="number"
                               value={formData.value?.get || ''}
                               onChange={(e) => setFormData(prev => ({
                                 ...prev,
                                 value: { ...prev.value, get: parseInt(e.target.value) }
                               }))}
                               required
                               min="1"
                               className="w-full p-2.5 border border-border rounded-lg"
                             />
                           </div>
                         </div>
                       </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Value *</label>
                        <input
                          type="text"
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                          required
                          className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                          placeholder={formData.type === 'discount_percentage' ? '10' : '50'}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Required Points</label>
                      <input
                        type="number"
                        value={formData.requiredPoints}
                        onChange={(e) => setFormData(prev => ({ ...prev, requiredPoints: parseInt(e.target.value) }))}
                        min="0"
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Min. Order Amount</label>
                      <input
                        type="number"
                        value={formData.conditions.minimumOrderAmount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          conditions: { ...prev.conditions, minimumOrderAmount: parseFloat(e.target.value) }
                        }))}
                        min="0"
                        step="0.01"
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">Schedule & Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Usage Limit (Total)</label>
                      <input
                        type="number"
                        value={formData.usageLimit || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value ? parseInt(e.target.value) : null }))}
                        min="1"
                        placeholder="Unlimited"
                        className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                      />
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          />
                          <div className={`block w-12 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-primary' : 'bg-muted'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.isActive ? 'transform translate-x-5' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-foreground">Active Campaign</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCampaign(null);
                      resetForm();
                    }}
                    className="px-5 py-2.5 bg-white border border-border text-foreground rounded-xl hover:bg-muted font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium shadow-sm hover:shadow transition-all"
                  >
                    {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Delete Campaign</h3>
              <p className="text-muted-foreground mb-6">Are you sure you want to delete this campaign? This cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, id: null })}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium shadow-md transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;
