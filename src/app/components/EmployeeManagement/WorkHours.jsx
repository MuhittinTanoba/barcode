'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';
import './employee-management.css';

const WorkHours = ({ employeeId, currentUser }) => {
  const [workHours, setWorkHours] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedRange, setSelectedRange] = useState('all');

  const canViewWorkHours = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'manager' || currentUser.role === 'admin') return true;
    return currentUser._id === employeeId;
  };

  useEffect(() => {
    if (employeeId) fetchEmployeeWorkHours();
  }, [employeeId]);

  const fetchEmployeeWorkHours = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${appConfig.employeeApiUrl}/${employeeId}/workhours`);
      setWorkHours(response.data);
      calculateTotalHours(response.data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch work hours');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const clockInData = { employee: employeeId, date: new Date().toISOString(), clockIn: new Date().toISOString() };
      await axios.post(`${appConfig.workHoursApiUrl}/clockin`, clockInData);
      await fetchEmployeeWorkHours();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const clockOutData = { employee: employeeId, clockOut: new Date().toISOString() };
      await axios.post(`${appConfig.workHoursApiUrl}/clockout`, clockOutData);
      await fetchEmployeeWorkHours();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRangeSelect = async (range) => {
    setSelectedRange(range);
    setDateRange({ startDate: '', endDate: '' });
    try {
      setLoading(true);
      setError(null);
      if (range === 'all') {
        const response = await axios.get(`${appConfig.employeeApiUrl}/${employeeId}/workhours`);
        setWorkHours(response.data);
        calculateTotalHours(response.data);
        return;
      }
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      let startDate;
      switch (range) {
        case 'today':
          startDate = endDate;
          break;
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'month':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'quarter':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          return;
      }
      const response = await axios.get(`${appConfig.employeeApiUrl}/${employeeId}/workhours`, {
        params: { startDate, endDate },
      });
      setWorkHours(response.data);
      calculateTotalHours(response.data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch work hours for selected range');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }
    setSelectedRange('custom');
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${appConfig.employeeApiUrl}/${employeeId}/workhours`, {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      });
      setWorkHours(response.data);
      calculateTotalHours(response.data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch work hours for custom range');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalHours = (data) => {
    const total = data.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    setTotalHours(Math.round(total * 100) / 100);
    const minutes = data.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);
    setTotalMinutes(minutes);
    calculateDailyAnalytics(data);
  };

  const calculateDailyAnalytics = (data) => {
    const map = {};
    data.forEach((r) => {
      const date = new Date(r.date).toISOString().split('T')[0];
      if (!map[date]) {
        map[date] = { date, clockIns: 0, clockOuts: 0, totalMinutes: 0, totalHours: 0, sessions: [] };
      }
      if (r.clockIn) map[date].clockIns++;
      if (r.clockOut) map[date].clockOuts++;
      map[date].totalMinutes += r.totalMinutes || 0;
      map[date].totalHours += r.totalHours || 0;
      map[date].sessions.push({ clockIn: r.clockIn, clockOut: r.clockOut, duration: r.totalHours || 0, durationMinutes: r.totalMinutes || 0 });
    });
    const analytics = Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date));
    setDailyAnalytics(analytics);
  };

  const formatDuration = (hours) => {
    const mins = Math.round(hours * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleDayExpansion = (date) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(date)) newSet.delete(date);
    else newSet.add(date);
    setExpandedDays(newSet);
  };

  const getRangeLabel = (range) => {
    switch (range) {
      case 'today': return 'Today';
      case 'week': return 'Last Week';
      case 'month': return 'Last Month';
      case 'quarter': return 'Last Quarter';
      case 'all': return 'All Time';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  if (!canViewWorkHours()) {
    return (
      <div className="emp-card">
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-lg font-semibold text-premium-primary mb-2">Access Denied</h3>
          <p className="text-premium-muted">You don't have permission to view this employee's work hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="emp-card">
      {/* Header actions */}
      <div className="mb-6">
        {error && <div className="p-4 mb-4 bg-red-100 border border-red-200 rounded text-red-800">{error}</div>}
        {currentUser && currentUser._id === employeeId && (
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={handleClockIn} disabled={loading} className="emp-btn emp-btn-primary">Clock In</button>
            <button onClick={handleClockOut} disabled={loading} className="emp-btn emp-btn-danger">Clock Out</button>
            <button onClick={fetchEmployeeWorkHours} disabled={loading} className="emp-btn emp-btn-secondary">Refresh</button>
          </div>
        )}
        {totalHours > 0 && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded mb-4">
            <p className="text-premium-primary font-semibold">Total Hours: {formatDuration(totalHours)} ({totalMinutes} min)</p>
            <p className="text-sm text-premium-muted">Range: {getRangeLabel(selectedRange)}</p>
          </div>
        )}
        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['today', 'week', 'month', 'quarter', 'all'].map(r => (
            <button key={r} onClick={() => handleQuickRangeSelect(r)} disabled={loading}
              className={`emp-btn ${selectedRange === r ? 'emp-btn-primary' : 'emp-btn-secondary'}`}>{getRangeLabel(r)}</button>
          ))}
        </div>
        {/* Custom date range */}
        <div className="flex items-end gap-2 mb-4">
          <input type="date" className="emp-input" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} />
          <input type="date" className="emp-input" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} />
          <button onClick={handleDateRangeChange} disabled={loading} className="emp-btn emp-btn-primary">Apply</button>
        </div>
      </div>

      {/* Daily analytics */}
      {dailyAnalytics.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-premium-primary mb-2">Daily Analytics</h4>
          {dailyAnalytics.map(day => (
            <div key={day.date} className="border border-slate-200 rounded mb-2">
              <div className="flex justify-between items-center p-3 cursor-pointer" onClick={() => toggleDayExpansion(day.date)}>
                <div>
                  <span className="font-medium text-premium-primary">{new Date(day.date).toLocaleDateString()}</span>
                  <span className="ml-2 text-sm text-premium-muted">{day.clockIns} in / {day.clockOuts} out</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-premium-primary">{formatDuration(day.totalHours)}</span>
                  <svg className={`w-4 h-4 transition-transform ${expandedDays.has(day.date) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {expandedDays.has(day.date) && (
                <div className="p-3 bg-slate-50">
                  {day.sessions.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                      <div className="flex space-x-2 items-center">
                        <span className="text-green-600">In:</span>
                        <span>{formatTime(s.clockIn)}</span>
                        <span className="text-red-600 ml-2">Out:</span>
                        <span>{formatTime(s.clockOut)}</span>
                      </div>
                      <div className="text-premium-primary font-medium">{formatDuration(s.duration)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Work hours table */}
      <div className="overflow-x-auto">
        <table className="emp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="4" className="text-center py-4 text-premium-muted">Loading...</td></tr>
            )}
            {!loading && workHours.length === 0 && (
              <tr><td colSpan="4" className="text-center py-8 text-premium-muted">No work hours recorded.</td></tr>
            )}
            {!loading && workHours.map(r => (
              <tr key={r._id} className="hover:bg-slate-100">
                <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{formatTime(r.clockIn)}</td>
                <td className="px-4 py-2">{formatTime(r.clockOut)}</td>
                <td className="px-4 py-2">{r.totalHours ? formatDuration(r.totalHours) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkHours;