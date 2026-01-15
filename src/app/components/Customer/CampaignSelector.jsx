'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';

const CampaignSelector = ({ isOpen, onClose, onCampaignSelect, customer, orderAmount }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      fetchAvailableCampaigns();
    }
  }, [isOpen, customer, orderAmount]);

  const fetchAvailableCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${appConfig.campaignApiUrl}/available/${customer._id}?orderAmount=${orderAmount}`
      );
      setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleApplyCampaign = () => {
    if (selectedCampaign) {
      onCampaignSelect(selectedCampaign);
      onClose();
    }
  };

  const getCampaignTypeLabel = (type) => {
    switch (type) {
      case 'discount_percentage': return 'Percentage Discount';
      case 'discount_fixed': return 'Fixed Discount';
      case 'free_product': return 'Free Product';
      case 'points_multiplier': return 'Points Multiplier';
      case 'birthday_special': return 'Birthday Special';
      default: return type;
    }
  };

  const calculateDiscount = (campaign, orderAmount) => {
    switch (campaign.type) {
      case 'discount_percentage':
        return (orderAmount * campaign.value) / 100;
      case 'discount_fixed':
        return Math.min(campaign.value, orderAmount);
      default:
        return 0;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-foreground">Available Campaigns</h2>
            <p className="text-sm text-muted-foreground">Select a promotion to apply to this order</p>
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

        {/* Customer Summary */}
        <div className="px-6 py-4 bg-secondary/50 border-b border-border flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-foreground">{customer.name}</div>
              <div className="text-xs text-muted-foreground">{customer.phone}</div>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-border shadow-sm">
              <span className="text-muted-foreground mr-2">Points:</span>
              <span className="font-bold text-accent">{customer.points}</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-border shadow-sm">
              <span className="text-muted-foreground mr-2">Order Total:</span>
              <span className="font-bold text-foreground">{formatCurrency(orderAmount)}</span>
            </div>
          </div>
        </div>

        {/* Campaign List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 font-medium text-sm">Checking eligible campaigns...</p>
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-foreground font-medium mb-1">No campaigns available</p>
              <p className="text-muted-foreground text-sm">This customer is not eligible for any active campaigns at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const discount = calculateDiscount(campaign, orderAmount);
                const isSelected = selectedCampaign?._id === campaign._id;
                
                return (
                  <div
                    key={campaign._id}
                    onClick={() => handleCampaignSelect(campaign)}
                    className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-accent bg-secondary/50 shadow-md ring-1 ring-accent'
                        : 'border-border hover:border-accent hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{campaign.name}</h3>
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                            {getCampaignTypeLabel(campaign.type)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-2">{campaign.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {campaign.requiredPoints > 0 && (
                            <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                              Requires {campaign.requiredPoints} pts
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                              Save {formatCurrency(discount)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-accent bg-accent' : 'border-border'
                        }`}>
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-border text-foreground rounded-xl hover:bg-muted font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCampaign}
            disabled={!selectedCampaign}
            className={`px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all ${
              selectedCampaign
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            Apply Selected Campaign
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignSelector;
