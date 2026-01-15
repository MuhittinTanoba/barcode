'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import appConfig from '../config';

const useMockData = appConfig.mockData; 

const CategoryList = ({ onCategorySelect, onCategoryNameSelect }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(!useMockData);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchCategories = async () => {
      try {
        const response = await axios.get(appConfig.categoryApiUrl);
        setCategories(response.data);
        if (response.data.length > 0) {
          setSelectedCategoryId(response.data[0]._id);
          onCategorySelect?.(response.data[0]._id);
          onCategoryNameSelect?.(response.data[0].name);
        }
      } catch (err) {
        setError('Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [onCategorySelect, onCategoryNameSelect]);

  const handleClick = (id) => {
    setSelectedCategoryId(id);
    onCategoryNameSelect?.(categories.find(c => c._id === id).name);
    onCategorySelect?.(id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-16">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-slate-600 text-sm">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700 mb-3 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="flex flex-col items-center space-y-2">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-slate-500 text-sm">No categories available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden max-h-[80vh] custom-thin-scrollbar">
      <div className="flex flex-col space-y-3">
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => handleClick(category._id)}
            className={`px-4 py-3 mr-2 rounded-xl transition-all duration-200 font-medium text-sm text-left flex items-center justify-between group ${
              selectedCategoryId === category._id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1'
                : 'bg-white text-muted-foreground hover:bg-secondary hover:text-primary hover:translate-x-1 border border-transparent hover:border-secondary'
            }`}
          >
            <span className="truncate overflow-hidden whitespace-nowrap flex-1 min-w-0 mr-2">
              {category.name}
            </span>
            {selectedCategoryId === category._id && (
              <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
