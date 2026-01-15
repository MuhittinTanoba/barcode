'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function AnalyticsPage() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch analytics data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">{t('processing')}...</div>;

    // Process Data
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment Methods
    const paymentMethods = orders.reduce((acc, order) => {
        const method = order.paymentMethod || 'cash';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
    }, {});

    // Sales Over Time (Last 7 Days)
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const salesByDate = last7Days.map(date => {
        const dayOrders = orders.filter(o => o.createdAt?.startsWith(date));
        return dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    });

    // Top Products
    const productSales = {};
    orders.forEach(order => {
        if (Array.isArray(order.items)) {
            order.items.forEach(item => {
                const name = item.name || 'Unknown';
                productSales[name] = (productSales[name] || 0) + (item.quantity || 1);
            });
        }
    });

    const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Charts Config
    const revenueChartData = {
        labels: last7Days,
        datasets: [
            {
                label: t('totalAmount') || 'Sales ($)',
                data: salesByDate,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3,
            }
        ]
    };

    const paymentChartData = {
        labels: Object.keys(paymentMethods).map(k => k.toUpperCase()),
        datasets: [
            {
                data: Object.values(paymentMethods),
                backgroundColor: [
                    'rgba(34, 197, 94, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(249, 115, 22, 0.6)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-slate-800">{t('analytics')}</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">{t('totalAmount') || 'Total Revenue'}</h3>
                    <p className="text-3xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Total Orders</h3>
                    <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Average Order Value</h3>
                    <p className="text-3xl font-bold text-slate-900">${averageOrderValue.toFixed(2)}</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold mb-4 text-slate-800">Revenue (Last 7 Days)</h3>
                    <div className="h-64">
                        <Line options={{ responsive: true, maintainAspectRatio: false }} data={revenueChartData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold mb-4 text-slate-800">{t('paymentMethod') || 'Payment Method Distribution'}</h3>
                    <div className="h-64 flex justify-center">
                        <Doughnut options={{ responsive: true, maintainAspectRatio: false }} data={paymentChartData} />
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold mb-4 text-slate-800">Top Selling Products</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-700">Product Name</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Quantity Sold</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topProducts.map(([name, quantity]) => (
                                <tr key={name} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-600">{name}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium text-right">{quantity}</td>
                                </tr>
                            ))}
                            {topProducts.length === 0 && (
                                <tr>
                                    <td colSpan="2" className="text-center py-4 text-slate-500">No sales data yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
