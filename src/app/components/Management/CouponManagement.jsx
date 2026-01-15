'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // New Coupon Form State
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        minOrderAmount: '0',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        usageLimit: '',
        description: ''
    });

    const [error, setError] = useState(null);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/coupons');
            setCoupons(res.data.coupons || []);
        } catch (err) {
            console.error('Failed to fetch coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await axios.post('/api/coupons', formData);
            setShowModal(false);
            setFormData({
                code: '',
                type: 'percentage',
                value: '',
                minOrderAmount: '0',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                usageLimit: '',
                description: ''
            });
            fetchCoupons();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create coupon');
        } finally {
            setSubmitting(false);
        }
    };

    const isExpired = (dateString) => {
        return new Date(dateString) < new Date();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Coupon Management</h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add New Coupon
                </button>
            </div>

            {/* Coupons List */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No coupons found. Create your first one!</td></tr>
                        ) : (
                            coupons.map((coupon) => (
                                <tr key={coupon._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-gray-900">{coupon.code}</div>
                                        {coupon.description && <div className="text-xs text-gray-500">{coupon.description}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${coupon.minOrderAmount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(coupon.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {coupon.usageCount} / {coupon.usageLimit || '∞'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            !coupon.isActive ? 'bg-red-100 text-red-800' :
                                            isExpired(coupon.endDate) ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {!coupon.isActive ? 'Inactive' : isExpired(coupon.endDate) ? 'Expired' : 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Coupon</h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 uppercase"
                                        value={formData.code}
                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        placeholder="SUMMER2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        value={formData.value}
                                        onChange={e => setFormData({...formData, value: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order ($)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({...formData, minOrderAmount: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        value={formData.startDate}
                                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        value={formData.endDate}
                                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (Optional)</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    value={formData.usageLimit}
                                    onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    rows="2"
                                ></textarea>
                            </div>

                            {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManagement;
