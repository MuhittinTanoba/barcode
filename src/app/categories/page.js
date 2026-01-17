'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import ProtectedRoute from '../components/ProtectedRoute';

const CategoriesPage = () => {
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [message, setMessage] = useState(null);

    const [newCategory, setNewCategory] = useState({
        name: '',
        slug: ''
    });

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
            const id = newCategory.slug; // Simple ID generation
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`/api/categories?id=${id}`);
            fetchCategories();
            showMessage('success', 'Category deleted');
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to delete category');
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (val, isEditing = false) => {
        const slug = val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        if (isEditing) {
            setEditingCategory({ ...editingCategory, name: val, slug });
        } else {
            setNewCategory({ name: val, slug });
        }
    };

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('categories') || 'Categories'}</h1>
                        <p className="text-gray-500 mt-1">Manage product categories</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Category
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Add Modal */}
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
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Slug / ID</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        {editingCategory?.id === cat.id ? (
                                            <input
                                                type="text"
                                                className="border rounded px-2 py-1 w-full"
                                                value={editingCategory.name}
                                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
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
            </div>
        </ProtectedRoute>
    );
};

export default CategoriesPage;
