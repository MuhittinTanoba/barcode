'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useOrderStatus } from '../context/OrderStatusContext';

const KpiCard = ({ title, value, subtitle, accent, icon }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-600 text-sm font-medium">{title}</p>
        <p className={`text-xl font-bold ${accent} mt-1`}>{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
      {icon && (
        <div className={`p-2 rounded-lg ${accent.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

const KpiBar = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeOrdersCount } = useOrderStatus();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orders, todayOrders] = await Promise.all([
          axios.get('/api/orders/analytics'),
          axios.get('/api/orders/analytics?from=' + new Date().toISOString().split('T')[0])
        ]);
        setData({ 
          orders: orders.data, 
          today: todayOrders.data 
        });
      } catch (e) {
        console.error('KPI fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = data?.orders?.totals?.totalRevenue || 0;
  const totalOrders = data?.orders?.totals?.totalOrders || 0;
  const avgTicket = data?.orders?.totals?.averageOrderValue || 0;
  const todayRevenue = data?.today?.totals?.totalRevenue || 0;
  const todayOrders = data?.today?.totals?.totalOrders || 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-6 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          title="Today's Revenue" 
          value={`$${todayRevenue.toFixed(2)}`} 
          subtitle={`${todayOrders} orders`}
          accent="text-green-600"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        <KpiCard 
          title="Active Orders" 
          value={activeOrdersCount} 
          subtitle="Currently processing"
          accent="text-orange-600"
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard 
          title="Avg Ticket" 
          value={`$${avgTicket.toFixed(2)}`} 
          subtitle="Per order"
          accent="text-purple-600"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <KpiCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          subtitle={`${totalOrders} orders`}
          accent="text-blue-600"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      </div>
    </div>
  );
};

export default KpiBar;


