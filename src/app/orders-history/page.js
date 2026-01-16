'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('/api/orders');
            // Sort by date desc
            const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sorted);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">{t('processing')}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">{t('orderHistory')}</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Order ID</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Items</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Total</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Payment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-500">#{order.id}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    {new Date(order.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex flex-col gap-1">
                                        {order.items.map((item, idx) => (
                                            <span key={idx}>
                                                {item.quantity}x {item.title || item.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-primary">
                                    {order.total?.toFixed(2)} TL
                                </td>
                                <td className="px-6 py-4 text-slate-600 capitalize">
                                    {order.paymentMethod}
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                    No orders found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
