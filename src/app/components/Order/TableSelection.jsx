'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../../config';

const TableSelection = ({ onTableSelect, onCancel, isProcessing = false }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get(appConfig.tableApiUrl);
      setTables(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to fetch tables');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 font-medium">Loading tables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-700 mb-3">{error}</p>
            <button
              onClick={fetchTables}
              className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableTables = tables.filter(table => table.status === 'available');

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Select Table</h2>
        <span className="text-sm text-slate-500">{availableTables.length} available</span>
      </div>
      
      {availableTables.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-lg text-slate-500">No available tables</p>
            <p className="text-sm text-slate-400">Please wait for a table to become available</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {availableTables.map(table => (
            <button
              key={table._id}
              onClick={() => onTableSelect(table)}
              disabled={isProcessing}
              className="group p-4 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/10 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center space-y-2">
                <svg className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div className="font-semibold text-slate-800">{table.name}</div>
                <div className="text-xs text-slate-500">Available</div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TableSelection; 