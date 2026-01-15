'use client';
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

const LocationManager = ({ onLocationChange, onClose }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'indoor',
    color: '#3B82F6',
    icon: '🏠'
  });

  // Fetch locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Handle add location
  const handleAddLocation = async () => {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create location');

      setShowAddModal(false);
      resetForm();
      fetchLocations();
      onLocationChange && onLocationChange();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle update location
  const handleUpdateLocation = async () => {
    try {
      const response = await fetch(`/api/locations/${selectedLocation._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update location');

      setShowEditModal(false);
      resetForm();
      fetchLocations();
      onLocationChange && onLocationChange();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete location
  const handleDeleteLocation = async () => {
    try {
      const response = await fetch(`/api/locations/${selectedLocation._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete location');

      setShowEditModal(false);
      fetchLocations();
      onLocationChange && onLocationChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'indoor',
      color: '#3B82F6',
      icon: '🏠'
    });
  };

  const handleEditClick = (location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      description: location.description,
      type: location.type,
      color: location.color,
      icon: location.icon
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 shadow-2xl border border-border">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading locations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Location Management</h3>
            <p className="text-sm text-muted-foreground mt-1">Manage restaurant locations and areas</p>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
            onClick={onClose}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-semibold text-foreground">Locations</h4>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/25 flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <FaPlus className="text-sm" />
            Add Location
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {locations.map(location => (
            <div
              key={location._id}
              className="border border-border rounded-xl p-4 hover:shadow-lg transition-all bg-white hover:border-primary/20 card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{location.icon}</span>
                  <h5 className="font-semibold text-foreground">{location.name}</h5>
                </div>
                <button
                  className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
                  onClick={() => handleEditClick(location)}
                >
                  <FaEdit />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{location.description}</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: location.color }}
                ></span>
                <span className="text-sm capitalize text-foreground font-medium">{location.type}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Location Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-border">
              <h4 className="text-xl font-bold text-foreground mb-6">Add New Location</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    placeholder="🏠"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Color</label>
                  <input
                    type="color"
                    className="w-full h-12 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/25"
                  onClick={handleAddLocation}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Location Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-border">
              <h4 className="text-xl font-bold text-foreground mb-6">Edit Location</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    placeholder="🏠"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Color</label>
                  <input
                    type="color"
                    className="w-full h-12 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium flex items-center gap-2"
                  onClick={handleDeleteLocation}
                >
                  <FaTrash className="text-sm" />
                  Delete
                </button>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/25 flex items-center gap-2"
                    onClick={handleUpdateLocation}
                  >
                    <FaSave className="text-sm" />
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationManager;
