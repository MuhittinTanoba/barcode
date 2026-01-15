'use client'
'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import EmployeeList from './EmployeeList';
import WorkHours from './WorkHours';
import appConfig from '../../config';
import { useAuth } from '../../context/AuthContext';
import './employee-management.css';

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalWorkHours: 0,
    averageWorkHours: 0,
    todayActiveEmployees: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const employeesResponse = await axios.get(appConfig.employeeApiUrl);
      const employeesData = Array.isArray(employeesResponse.data) ? employeesResponse.data : [];
      setEmployees(employeesData);

      const workHoursResponse = await axios.get(appConfig.workHoursApiUrl);
      const workHoursData = Array.isArray(workHoursResponse.data) ? workHoursResponse.data : [];
      setWorkHours(workHoursData);

      const activeEmployees = employeesData.filter(emp => emp.isActive).length;
      const totalWorkHours = workHoursData.reduce((sum, record) => sum + (record.totalHours || 0), 0);
      const averageWorkHours = workHoursData.length > 0 ? totalWorkHours / workHoursData.length : 0;
      
      const today = new Date().toISOString().split('T')[0];
      const todayWorkHours = workHoursData.filter(record => 
        new Date(record.date).toISOString().split('T')[0] === today
      );
      const todayActiveEmployees = new Set(todayWorkHours.map(record => record.employee)).size;

      setStats({
        totalEmployees: employeesData.length,
        activeEmployees,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        averageWorkHours: Math.round(averageWorkHours * 100) / 100,
        todayActiveEmployees
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentWorkHours = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return workHours.filter(record => 
      new Date(record.date) >= lastWeek
    ).slice(0, 5);
  };

  const getEmployeeStats = (employeeId) => {
    const employeeWorkHours = workHours.filter(record => record.employee === employeeId);
    const totalHours = employeeWorkHours.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const totalSessions = employeeWorkHours.length;
    const averageHours = totalSessions > 0 ? totalHours / totalSessions : 0;
    
    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalSessions,
      averageHours: Math.round(averageHours * 100) / 100
    };
  };

  if (loading) {
    return (
      <div className="employee-dashboard flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
          <p className="text-premium-muted font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <header className="employee-header">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-premium-primary tracking-tight">Team Overview</h1>
              <p className="text-premium-muted mt-1 font-medium">Manage employees, track hours, and analyze performance.</p>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-border shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-bold text-premium-primary">
                {stats.activeEmployees} Active Now
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="emp-card">
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label">Total Staff</p>
              <div className="icon-bg icon-bg-blue">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="stat-value">{stats.totalEmployees}</p>
          </div>

          <div className="emp-card">
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label">Active</p>
              <div className="icon-bg icon-bg-emerald">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="stat-value text-emerald-600">{stats.activeEmployees}</p>
          </div>

          <div className="emp-card">
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label">Today Active</p>
              <div className="icon-bg icon-bg-amber">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="stat-value text-amber-600">{stats.todayActiveEmployees}</p>
          </div>

          <div className="emp-card">
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label">Total Hours</p>
              <div className="icon-bg icon-bg-purple">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="stat-value text-purple-600">{stats.totalWorkHours}h</p>
          </div>

          <div className="emp-card">
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label">Avg Hours</p>
              <div className="icon-bg icon-bg-indigo">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="stat-value text-indigo-600">{stats.averageWorkHours}h</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee List */}
          <div className="lg:col-span-2">
             <EmployeeList onSelectEmployee={setSelectedEmployee} />
          </div>

          {/* Recent Activity & Employee Details */}
          <div className="space-y-6">
            {/* Recent Work Hours */}
            <div className="emp-card">
              <h3 className="text-lg font-bold text-premium-primary mb-4 border-b border-border pb-2">Recent Activity</h3>
              <div className="space-y-3">
                {getRecentWorkHours().map((record) => {
                  const employee = employees.find(emp => emp._id === record.employee);
                  return (
                    <div key={record._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-white border border-transparent hover:border-blue-100 transition-all cursor-default">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 shadow-sm text-premium-primary font-bold">
                           {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : '??'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-premium-primary">
                            {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'}
                          </p>
                          <p className="text-xs text-premium-muted font-medium">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-premium-primary">{record.totalHours}h</p>
                        <p className="text-xs text-premium-muted">
                          {new Date(record.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Employee Details */}
            {selectedEmployee ? (
              <div className="emp-card border-l-4 border-l-primary">
                <h3 className="text-lg font-bold text-premium-primary mb-4">Employee Profile</h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                      <span className="text-2xl font-bold">
                        {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-premium-primary">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </h4>
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider mt-1">
                        {selectedEmployee.position}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                      <span className="text-sm font-medium text-premium-muted">Email</span>
                      <span className="text-sm font-semibold text-premium-primary truncate max-w-[180px]">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                      <span className="text-sm font-medium text-premium-muted">Phone</span>
                      <span className="text-sm font-semibold text-premium-primary">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                      <span className="text-sm font-medium text-premium-muted">Status</span>
                      <span className={`status-badge ${selectedEmployee.isActive ? 'status-active' : 'status-inactive'}`}>
                        {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-premium-muted">Joined</span>
                      <span className="text-sm font-semibold text-premium-primary">
                        {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Employee Statistics */}
                  {(() => {
                    const employeeStats = getEmployeeStats(selectedEmployee._id);
                    return (
                      <div className="pt-4 mt-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-xl font-extrabold text-blue-600">{employeeStats.totalHours}h</p>
                            <p className="text-[10px] text-premium-muted font-bold uppercase mt-1">Total</p>
                          </div>
                          <div className="text-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-xl font-extrabold text-emerald-600">{employeeStats.totalSessions}</p>
                            <p className="text-[10px] text-premium-muted font-bold uppercase mt-1">Sessions</p>
                          </div>
                          <div className="text-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-xl font-extrabold text-purple-600">{employeeStats.averageHours}</p>
                            <p className="text-[10px] text-premium-muted font-bold uppercase mt-1">Avg/Ses</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
                 <div className="emp-card flex flex-col items-center justify-center text-center py-12 border-dashed border-2">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                         <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <p className="text-premium-primary font-semibold">Select an employee</p>
                    <p className="text-sm text-premium-muted mt-1">View detailed profile and stats</p>
                </div>
            )}
          </div>
        </div>

        {/* Work Hours Section */}
        {selectedEmployee && (
          <div className="mt-8">
            <div className="emp-card">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-premium-primary">
                  Work Hours History
                </h2>
                <p className="text-sm text-premium-muted">Viewing records for <span className="font-semibold text-primary">{selectedEmployee.firstName} {selectedEmployee.lastName}</span></p>
              </div>
              <WorkHours employeeId={selectedEmployee._id} currentUser={user} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;