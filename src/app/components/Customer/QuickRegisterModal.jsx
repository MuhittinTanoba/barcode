'use client'
import React, { useState } from 'react';
import axios from 'axios';
import appConfig from '../../config';

const QuickRegisterModal = ({ isOpen, onClose, onCustomerRegistered, existingCustomer }) => {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    email: '',
    birthday: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isQuickRegistration, setIsQuickRegistration] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(appConfig.customerApiUrl, {
        ...formData,
        isQuickRegistration
      });

      if (response.data.customer) {
        onCustomerRegistered(response.data.customer);
        onClose();
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.customer) {
        // Customer already exists
        onCustomerRegistered(err.response.data.customer);
        onClose();
      } else {
        setError(err.response?.data?.error || 'Failed to register customer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-bold text-foreground">
            {existingCustomer ? 'Customer Found' : 'New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {existingCustomer ? (
            <div className="space-y-6">
              <div className="bg-secondary border border-border rounded-xl p-5 text-center">
                <div className="w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {existingCustomer.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{existingCustomer.name}</h3>
                <p className="text-muted-foreground font-medium mb-3">{existingCustomer.phone}</p>
                <div className="flex justify-center gap-3 text-sm">
                  <span className="bg-white px-3 py-1 rounded-lg border border-border text-accent font-medium shadow-sm">
                    {existingCustomer.points} Points
                  </span>
                  <span className="bg-white px-3 py-1 rounded-lg border border-border text-accent font-medium shadow-sm capitalize">
                    {existingCustomer.tier} Tier
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onCustomerRegistered(existingCustomer)}
                  className="py-2.5 px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium shadow-sm transition-all"
                >
                  Select Customer
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 bg-white border border-border text-foreground rounded-xl hover:bg-muted font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all placeholder:text-muted-foreground"
                placeholder="+90 5XX XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all placeholder:text-muted-foreground"
                placeholder="John Doe"
              />
            </div>

            <div className={`space-y-4 overflow-hidden transition-all duration-300 ${isQuickRegistration ? 'max-h-0 opacity-0' : 'max-h-48 opacity-100'}`}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all placeholder:text-muted-foreground"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isQuickRegistration}
                    onChange={(e) => setIsQuickRegistration(e.target.checked)}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isQuickRegistration ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isQuickRegistration ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-foreground group-hover:text-foreground transition-colors">Quick Registration</span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="py-3 px-4 bg-white border border-border text-foreground rounded-xl hover:bg-muted font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`py-3 px-4 rounded-xl font-medium text-primary-foreground shadow-sm transition-all ${
                  isLoading
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 hover:shadow'
                }`}
              >
                  {isLoading ? 'Saving...' : 'Register'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickRegisterModal;
