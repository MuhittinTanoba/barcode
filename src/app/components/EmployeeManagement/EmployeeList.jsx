'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';
import './employee-management.css';

const EmployeeList = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ firstName: '', lastName: '', position: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(appConfig.employeeApiUrl);
      setEmployees(response.data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(appConfig.employeeApiUrl, newEmployee);
      setNewEmployee({ firstName: '', lastName: '', position: '' });
      setIsAddingEmployee(false);
      fetchEmployees();
    } catch (e) {
      console.error(e);
      setError('Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = (id) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirmation.id) return;
    try {
      setLoading(true);
      await axios.delete(`${appConfig.employeeApiUrl}/${deleteConfirmation.id}`);
      fetchEmployees();
    } catch (e) {
      console.error(e);
      setError('Failed to delete employee');
    } finally {
      setLoading(false);
      setDeleteConfirmation({ isOpen: false, id: null });
    }
  };

  return (
    <div className="emp-card">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-premium-primary">Team Members</h2>
          <p className="text-sm text-premium-muted mt-1">View and manage your staff</p>
        </div>
        <button onClick={() => setIsAddingEmployee(true)} className="emp-btn emp-btn-primary">
          Add Employee
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {isAddingEmployee && (
        <form onSubmit={handleAddEmployee} className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input type="text" value={newEmployee.firstName} onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })} required className="emp-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input type="text" value={newEmployee.lastName} onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })} required className="emp-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
              <input type="text" value={newEmployee.position} onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })} required className="emp-input" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={loading} className="emp-btn emp-btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Save Employee
            </button>
            <button type="button" onClick={() => setIsAddingEmployee(false)} className="emp-btn emp-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="emp-table">
            <thead className="bg-slate-50">
              <tr>
                <th>Employee</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {employees && employees.length > 0 ? (
                employees.map(employee => (
                  <tr key={employee._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">{employee.firstName[0]}{employee.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{employee.firstName} {employee.lastName}</p>
                          <p className="text-xs text-slate-500">Hired {new Date(employee.hireDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{employee.position}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{employee.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => onSelectEmployee(employee)} className="emp-btn emp-btn-primary flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View
                        </button>
                        <button onClick={() => handleDeleteEmployee(employee._id)} className="emp-btn emp-btn-danger flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                      <p className="text-slate-500 font-medium">No employees found</p>
                      <p className="text-sm text-slate-400">Add your first employee to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Employee</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this employee? This cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, id: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
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

export default EmployeeList;