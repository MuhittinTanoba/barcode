'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const CategoryManagement = () => {
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [message, setMessage] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null });

    const [newCategory, setNewCategory] = useState({
        name: '',
        slug: ''
    });

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
            showMessage('error', 'Failed to fetch categories');
        } finally {
            setIsLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const id = newCategory.slug; 
            await axios.post('/api/categories', { ...newCategory, id });
            setNewCategory({ name: '', slug: '' });
            setIsAdding(false);
            fetchCategories();
            showMessage('success', 'Category added');
        } catch (error) {
            showMessage('error', 'Failed to add category');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/categories', editingCategory);
            setEditingCategory(null);
            fetchCategories();
            showMessage('success', 'Category updated');
        } catch (error) {
            showMessage('error', 'Failed to update category');
        }
    };

    const handleDelete = (id) => {
        setDeleteConfirmation({ isOpen: true, id });
    };

    const confirmDeleteAction = async () => {
        if (!deleteConfirmation.id) return;
        try {
            await axios.delete(`/api/categories?id=${deleteConfirmation.id}`);
            fetchCategories();
            showMessage('success', 'Category deleted');
        } catch (error) {
             showMessage('error', error.response?.data?.message || 'Failed to delete category');
        } finally {
            setDeleteConfirmation({ isOpen: false, id: null });
        }
    };

    const handleNameChange = (val, isEditing = false) => {
        const slug = val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        if (isEditing) {
            setEditingCategory({ ...editingCategory, name: val, slug });
        } else {
            setNewCategory({ name: val, slug });
        }
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('categories') || 'Categories'}</h2>
                    <p className="text-gray-500 mt-1">Manage product categories</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                   className="bg-primary text-primary-foreground px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all duration-300 flex items-center gap-2 font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Category
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                     <span className="font-medium">{message.text}</span>
                </div>
            )}

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Add New Category</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary"
                                    value={newCategory.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Slug (ID)</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                                    value={newCategory.slug}
                                    readOnly
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-white px-4 py-2 rounded-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Slug / ID</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredCategories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    {editingCategory?.id === cat.id ? (
                                        <input 
                                            type="text" 
                                            className="border rounded px-2 py-1 w-full" 
                                            value={editingCategory.name} 
                                            onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                        />
                                    ) : (
                                        <span className="font-medium text-gray-900">{cat.name}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {editingCategory?.id === cat.id ? (
                                        <>
                                            <button onClick={handleUpdate} className="text-green-600 hover:text-green-900 font-medium">Save</button>
                                            <button onClick={() => setEditingCategory(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setEditingCategory(cat)} className="text-blue-600 hover:text-blue-900">Edit</button>
                                            {cat.id !== 'all' && (
                                                <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Category</h3>
                            <p className="text-gray-500 mb-6">Are you sure you want to delete this category? This cannot be undone.</p>
                            
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

export default CategoryManagement;