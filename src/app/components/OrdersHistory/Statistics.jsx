'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Statistics = ({ orders }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllRevenueByGroup, setShowAllRevenueByGroup] = useState(false);
  const [showAllPaymentMethods, setShowAllPaymentMethods] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get('/api/orders/analytics?groupBy=day');
        setAnalytics(res.data);
      } catch (err) {
        setError('Failed to load analytics');
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Calculate fallback statistics from orders if analytics not available
  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Filter only paid orders for revenue calculations
    const paidOrders = orders.filter(order => order.status === 'paid');
    
    const totalOrders = orders.length;
    // Only count revenue from paid orders
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Today's orders (all statuses for count, but only paid for revenue)
    const todayOrders = orders.filter(order => new Date(order.createdAt?.$date || order.createdAt) >= today);
    const todayPaidOrders = todayOrders.filter(order => order.status === 'paid');
    const todayRevenue = todayPaidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Week's orders (all statuses for count, but only paid for revenue)
    const weekOrders = orders.filter(order => new Date(order.createdAt?.$date || order.createdAt) >= weekAgo);
    const weekPaidOrders = weekOrders.filter(order => order.status === 'paid');
    const weekRevenue = weekPaidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Month's orders (all statuses for count, but only paid for revenue)
    const monthOrders = orders.filter(order => new Date(order.createdAt?.$date || order.createdAt) >= monthAgo);
    const monthPaidOrders = monthOrders.filter(order => order.status === 'paid');
    const monthRevenue = monthPaidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const paidOrdersCount = paidOrders.length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    const returnedOrders = orders.filter(order => order.status === 'returned').length;
    
    // Calculate returns amount (for all returned orders in the set)
    const returnedAmount = orders.filter(order => order.status === 'returned')
                                 .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Exclude returned from Total Revenue? 
    // The previous logic only included 'paid' orders. 
    // If an order goes from 'paid' -> 'returned', it's no longer 'paid'.
    // So 'totalRevenue' (lines 43, 48, 53, 58) correctly excludes it because the status is now 'returned'.
    // We just need to display the Returns separately.

    // Calculate average order value (only from paid orders)
    const averageOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

    // Get top selling items (only from paid orders)
    const itemCounts = {};
    paidOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const itemName = item.name || 'Unknown Item';
          const quantity = item.quantity?.$numberInt || item.quantity || 1;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;
        });
      }
    });

    const topItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalOrders,
      totalRevenue,
      todayOrders: todayOrders.length,
      todayRevenue,
      weekOrders: weekOrders.length,
      weekRevenue,
      monthOrders: monthOrders.length,
      monthRevenue,
      pendingOrders,
      paidOrders: paidOrdersCount,
      cancelledOrders,
      returnedOrders,
      returnedAmount,
      averageOrderValue,
      topItems
    };
  };

  const stats = calculateStats();
  const totals = analytics?.totals;

  const StatCard = ({ title, value, subtitle, icon, gradient = 'from-primary to-primary/80', iconBg = 'bg-primary/10' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`${iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200`}></div>
    </div>
  );

  const MetricCard = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={totals ? totals.totalOrders : stats.totalOrders}
          subtitle="All time"
          icon={
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          gradient="from-primary to-primary/80"
          iconBg="bg-primary/10"
        />
        
        <StatCard
          title="Total Revenue"
          value={`$${(totals ? totals.totalRevenue : stats.totalRevenue).toFixed(2)}`}
          subtitle="All time"
          icon={
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          gradient="from-accent to-accent/80"
          iconBg="bg-accent/10"
        />
        
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          subtitle={`$${stats.todayRevenue.toFixed(2)} revenue`}
          icon={
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          gradient="from-orange-500 to-orange-400"
          iconBg="bg-orange-50"
        />
        
        <StatCard
          title="Average Order"
          value={`$${(totals ? totals.averageOrderValue : stats.averageOrderValue).toFixed(2)}`}
          subtitle="Per order"
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          gradient="from-purple-500 to-purple-400"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Revenue Timeline - Premium Card */}
      <MetricCard title="Revenue Overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-700">Today</p>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-700 mb-1">${stats.todayRevenue.toFixed(2)}</p>
            <p className="text-xs text-green-600">{stats.todayOrders} orders</p>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-5 border border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-accent">This Week</p>
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-accent mb-1">${stats.weekRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{stats.weekOrders} orders</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-700">This Month</p>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-purple-700 mb-1">${stats.monthRevenue.toFixed(2)}</p>
            <p className="text-xs text-purple-600">{stats.monthOrders} orders</p>
          </div>
        </div>
      </MetricCard>

      {/* Order Status & Top Items - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricCard title="Order Status Breakdown">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-foreground">Pending</span>
              </div>
              <span className="font-bold text-lg text-foreground">{totals?.pendingOrders !== undefined ? totals.pendingOrders : stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-foreground">Paid</span>
              </div>
              <span className="font-bold text-lg text-foreground">{totals ? totals.paidOrders : stats.paidOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-foreground">Cancelled</span>
              </div>
              <span className="font-bold text-lg text-foreground">{totals ? totals.cancelledOrders : stats.cancelledOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-foreground">Returned</span>
              </div>
              <div className="text-right">
                  <span className="font-bold text-lg text-foreground block">{totals ? totals.returnedOrders : stats.returnedOrders}</span>
                  <span className="text-xs text-orange-600 font-medium">(${ (totals ? totals.returnedAmount : stats.returnedAmount).toFixed(2) })</span>
              </div>
            </div>
          </div>
        </MetricCard>

        <MetricCard title="Top Selling Items">
          <div className="space-y-3">
            {stats.topItems.length > 0 ? (
              stats.topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="font-medium text-foreground truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground ml-2">{item.count} items</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">No order data yet</p>
            )}
          </div>
        </MetricCard>
      </div>

      {/* Revenue by Time Group */}
      {analytics && analytics.byTime?.length > 0 && (
        <MetricCard title="Revenue by Time Period">
          <div className="space-y-2">
            {analytics.byTime.slice(0, showAllRevenueByGroup ? analytics.byTime.length : 5).map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="font-medium text-foreground">{t._id}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t.orders} orders</span>
                  <span className="font-bold text-accent">${t.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {analytics.byTime.length > 5 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowAllRevenueByGroup(!showAllRevenueByGroup);
                }}
                className="w-full mt-3 px-4 py-2 text-sm font-medium text-accent hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors border border-border"
              >
                {showAllRevenueByGroup ? 'Show Less' : `Show All (${analytics.byTime.length})`}
              </button>
            )}
          </div>
        </MetricCard>
      )}

      {/* Top Products and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricCard title="Top Products">
          {analytics && analytics.byProduct?.length > 0 ? (
            <div className="space-y-3">
              {analytics.byProduct.slice(0, showAllProducts ? analytics.byProduct.length : 5).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-accent">{idx + 1}</span>
                    </div>
                    <span className="font-medium text-foreground truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-muted-foreground">{p.quantity}</span>
                    <span className="font-bold text-accent">${p.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {analytics.byProduct.length > 5 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAllProducts(!showAllProducts);
                  }}
                  className="w-full mt-3 px-4 py-2 text-sm font-medium text-accent hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors border border-border"
                >
                  {showAllProducts ? 'Show Less' : `Show All (${analytics.byProduct.length})`}
                </button>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">No product data</p>
          )}
        </MetricCard>

        <MetricCard title="Top Categories">
          {analytics && analytics.byCategory?.length > 0 ? (
            <div className="space-y-3">
              {analytics.byCategory.slice(0, showAllCategories ? analytics.byCategory.length : 5).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{c.quantity}</span>
                    <span className="font-bold text-primary">${c.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {analytics.byCategory.length > 5 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAllCategories(!showAllCategories);
                  }}
                  className="w-full mt-3 px-4 py-2 text-sm font-medium text-accent hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors border border-border"
                >
                  {showAllCategories ? 'Show Less' : `Show All (${analytics.byCategory.length})`}
                </button>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">No category data</p>
          )}
        </MetricCard>
      </div>

      {/* Payment Method Breakdown */}
      {analytics && analytics.byPaymentMethod?.length > 0 && (
        <MetricCard title="Payment Methods">
          <div className="space-y-3">
            {analytics.byPaymentMethod.slice(0, showAllPaymentMethods ? analytics.byPaymentMethod.length : 5).map((pm, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="font-medium text-foreground capitalize">{pm.paymentMethod || 'unknown'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{pm.orders} orders</span>
                  <span className="font-bold text-accent">${pm.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {analytics.byPaymentMethod.length > 5 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowAllPaymentMethods(!showAllPaymentMethods);
                }}
                className="w-full mt-3 px-4 py-2 text-sm font-medium text-accent hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors border border-border"
              >
                {showAllPaymentMethods ? 'Show Less' : `Show All (${analytics.byPaymentMethod.length})`}
              </button>
            )}
          </div>
        </MetricCard>
      )}
    </div>
  );
};

export default Statistics;
