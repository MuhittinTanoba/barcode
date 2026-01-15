'use client';
import React, { useState, useEffect } from 'react';
import { FaChair, FaEdit, FaTrash, FaPlus, FaCog, FaArrowsAlt, FaSave, FaUndo, FaMapMarkerAlt, FaHome, FaTree, FaCrown } from 'react-icons/fa';
import LocationManager from './LocationManager';
import TableOrderManager from './TableOrderManager';

const TableGrid = () => {
  // State
  const [tables, setTables] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTable, setDraggedTable] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showOrderManager, setShowOrderManager] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTableId, setTargetTableId] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    status: 'available',
    capacity: 3,
    shape: 'round',
    location: ''
  });

  // Grid configuration
  const [gridConfig, setGridConfig] = useState({
    rows: 6,
    cols: 8,
    cellSize: 100
  });

  // Constants
  const CONTAINER_WIDTH = 800;
  const CONTAINER_HEIGHT = 600;
  const TABLE_SIZE = 1; // 1x1 grid cell

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
      if (data.length > 0 && !selectedLocation) {
        setSelectedLocation(data[0]._id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch tables
  const fetchTables = async (locationId = null) => {
    try {
      setLoading(true);
      const url = locationId ? `/api/tables?location=${locationId}` : '/api/tables';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Load tables when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchTables(selectedLocation);
    }
  }, [selectedLocation]);

  // Mouse event handlers
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggedTable]);

  // Grid calculations with center-based coordinate system
  const getCellSize = () => ({
    width: CONTAINER_WIDTH / gridConfig.cols,
    height: CONTAINER_HEIGHT / gridConfig.rows
  });

  const getGridPosition = (x, y) => {
    const cellSize = getCellSize();
    const centerX = CONTAINER_WIDTH / 2;
    const centerY = CONTAINER_HEIGHT / 2;
    
    // Convert pixel position to grid coordinates relative to center
    const col = Math.round((x - centerX) / cellSize.width);
    const row = Math.round((y - centerY) / cellSize.height);
    
    // Ensure table fits within bounds (1x1 table)
    const maxCol = Math.floor(gridConfig.cols / 2);
    const maxRow = Math.floor(gridConfig.rows / 2);
    
    return {
      col: Math.max(-maxCol, Math.min(col, maxCol - 1)),
      row: Math.max(-maxRow, Math.min(row, maxRow - 1))
    };
  };

  const getPixelPosition = (gridRow, gridCol) => {
    const cellSize = getCellSize();
    const centerX = CONTAINER_WIDTH / 2;
    const centerY = CONTAINER_HEIGHT / 2;
    
    return {
      x: centerX + (gridCol * cellSize.width) - (cellSize.width / 2),
      y: centerY + (gridRow * cellSize.height) - (cellSize.height / 2)
    };
  };

  const isPositionOccupied = (row, col, excludeId = null) => {
    return tables.some(table => {
      if (table._id === excludeId) return false;
      // Check if the exact same position is occupied (1x1 table)
      return row === table.gridRow && col === table.gridCol;
    });
  };

  // Event handlers
  const handleTableClick = (table) => {
    if (isEditMode) {
      setSelectedTable(table);
      setFormData({
        number: table.number,
        name: table.name,
        status: table.status,
        capacity: table.capacity,
        shape: table.shape || 'round',
        location: table.location?._id || selectedLocation
      });
      setShowEditModal(true);
    } else {
      // Show order manager for table
      setSelectedTable(table);
      setShowOrderManager(true);
    }
  };

  const handleMouseDown = (e, table) => {
    if (!isEditMode) return;
    e.preventDefault();
    setIsDragging(true);
    setDraggedTable(table);
    
    // Calculate drag offset for smooth dragging
    const rect = e.currentTarget.getBoundingClientRect();
    const container = document.getElementById('table-container');
    const containerRect = container.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedTable) return;
    
    const container = document.getElementById('table-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridPos = getGridPosition(x, y);
    const canPlace = !isPositionOccupied(gridPos.row, gridPos.col, draggedTable._id);
    
    
    
    // Update table position in real-time
    setTables(prevTables => 
      prevTables.map(table => 
        table._id === draggedTable._id 
          ? { ...table, gridRow: gridPos.row, gridCol: gridPos.col, _canPlace: canPlace }
          : table
      )
    );
    
    // Update dragged table reference
    setDraggedTable({
      ...draggedTable,
      gridRow: gridPos.row,
      gridCol: gridPos.col,
      _canPlace: canPlace
    });
  };

  const handleMouseUp = async () => {
    if (!isDragging || !draggedTable) return;
    
    setIsDragging(false);
    
    const canPlace = !isPositionOccupied(draggedTable.gridRow, draggedTable.gridCol, draggedTable._id);
    
    if (canPlace) {
      try {
        const response = await fetch(`/api/tables/${draggedTable._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            gridRow: draggedTable.gridRow,
            gridCol: draggedTable.gridCol
          })
        });
        
        if (!response.ok) throw new Error('Failed to update position');
        fetchTables();
      } catch (err) {
        setError('Failed to update table position');
        fetchTables();
      }
    } else {
      fetchTables();
    }
    
    setDraggedTable(null);
  };



  // Transfer Table Logic
  const handleInitiateTransfer = (e, table) => {
    e.stopPropagation(); // Prevent opening order manager
    setSelectedTable(table);
    setTargetTableId('');
    setShowTransferModal(true);
  };

  const handleTransferTable = async () => {
    if (!targetTableId) {
      setError('Please select a target table');
      return;
    }

    try {
      const response = await fetch('/api/tables/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTableId: selectedTable._id,
          toTableId: targetTableId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Transfer failed');
      }

      // Success
      setShowTransferModal(false);
      fetchTables(selectedLocation); // Refresh grid
      
      // Reset states
      setSelectedTable(null);
      setTargetTableId('');
    } catch (err) {
      setError(err.message);
    }
  };
  const updateTableStatus = async (tableId, newStatus) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddTable = async () => {
    try {
      // Find first available position starting from center (0,0)
      let availablePos = null;
      const maxDistance = Math.floor(Math.min(gridConfig.rows, gridConfig.cols) / 2);
      
      // Search in spiral pattern from center
      for (let distance = 0; distance <= maxDistance; distance++) {
        for (let row = -distance; row <= distance; row++) {
          for (let col = -distance; col <= distance; col++) {
            // Only check positions at current distance from center
            if (Math.abs(row) === distance || Math.abs(col) === distance) {
              if (!isPositionOccupied(row, col)) {
                availablePos = { row, col };
                break;
              }
            }
          }
          if (availablePos) break;
        }
        if (availablePos) break;
      }

      if (!availablePos) {
        setError('No available space for new table');
        return;
      }

      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          gridRow: availablePos.row,
          gridCol: availablePos.col
        })
      });

      if (!response.ok) throw new Error('Failed to create table');

      setShowAddModal(false);
      resetForm();
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTable = async () => {
    try {
      const response = await fetch(`/api/tables/${selectedTable._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update table');

      setShowEditModal(false);
      resetForm();
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTable = async () => {
    try {
      const response = await fetch(`/api/tables/${selectedTable._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete table');

      setShowEditModal(false);
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      name: '',
      status: 'available',
      capacity: 3,
      shape: 'round',
      location: selectedLocation || ''
    });
  };

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'border-accent/30 bg-accent/10';
      case 'occupied': return 'border-destructive/30 bg-destructive/10';
      case 'waiting_for_payment': return 'border-secondary/50 bg-secondary/20';
      default: return 'border-border bg-muted';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'waiting_for_payment': return 'Waiting for Payment';
      default: return 'Unknown';
    }
  };

  const getShapeClasses = (shape) => {
    switch (shape) {
      case 'round': return 'rounded-full';
      case 'square': return 'rounded-lg';
      case 'rectangle': return 'rounded-lg';
      default: return 'rounded-lg';
    }
  };

  const getShapeStyles = (shape, width, height) => {
    switch (shape) {
      case 'round': 
        const size = Math.min(width, height);
        return { width: `${size}px`, height: `${size}px` };
      case 'rectangle':
        return { width: `${width * 1.5}px`, height: `${height * 0.8}px` };
      case 'square':
      default:
        return { width: `${width}px`, height: `${height}px` };
    }
  };

  const getTableStats = () => {
    const total = tables.length;
    const available = tables.filter(t => t.status === 'available').length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const waitingForPayment = tables.filter(t => t.status === 'waiting_for_payment').length;
    return { total, available, occupied, waitingForPayment };
  };

  // Render table
  const renderTable = (table) => {
    // Use current position if dragging, otherwise use stored position
    let gridRow, gridCol;
    
    if (isDragging && draggedTable?._id === table._id) {
      // Use real-time position during drag
      gridRow = table.gridRow;
      gridCol = table.gridCol;
    } else {
      // Use stored position
      gridRow = table.gridRow;
      gridCol = table.gridCol;
    }
    
    const position = getPixelPosition(gridRow, gridCol);
    const cellSize = getCellSize();
    const baseWidth = cellSize.width - 4;
    const baseHeight = cellSize.height - 4;
    const shapeStyles = getShapeStyles(table.shape || 'round', baseWidth, baseHeight);
    
    const isDragged = isDragging && draggedTable?._id === table._id;
    const canPlace = table._canPlace !== false;
    
    return (
      <div
        key={table._id}
        className={`absolute bg-white border-2 transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-xl ${
          getStatusColor(table.status)
        } ${getShapeClasses(table.shape || 'round')} ${isEditMode ? 'border-dashed border-primary cursor-move' : ''} ${
          isDragged ? 'z-50 shadow-2xl' : 'z-10'
        } ${isDragged && !canPlace ? 'border-destructive bg-destructive/20' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => handleMouseDown(e, table)}
        style={{
          left: `${position.x + 2}px`,
          top: `${position.y + 2}px`,
          ...shapeStyles,
          opacity: isDragged ? 0.8 : 1
        }}
      >
        <div className="p-2 text-center relative h-full flex flex-col items-center justify-center">
          <div className="flex justify-center mb-1">
            <FaChair className={`text-lg ${
              table.status === 'available' ? 'text-accent' :
              table.status === 'occupied' ? 'text-destructive' : 'text-foreground'
            }`} />
          </div>
          <h3 className="font-bold text-foreground text-sm mb-1">
            Table {table.number}
          </h3>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
              table.status === 'available' ? 'bg-accent text-accent-foreground' :
              table.status === 'occupied' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
              {getStatusText(table.status)}
            </span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {table.capacity}-Seat
          </span>
          {table.location && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-xs">{table.location.icon}</span>
              <span className="text-xs text-muted-foreground">{table.location.name}</span>
            </div>
          )}
          
          {/* Edit Mode Button */}
          {isEditMode && (
          <button
            className="absolute top-1 right-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-1.5 shadow-lg transition-all z-20 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              handleTableClick(table);
            }}
            title="Edit Table"
          >
            <FaEdit className="text-xs" />
          </button>
          )}

          {/* Transfer Button - Only for occupied tables and NOT in edit mode */}
          {!isEditMode && table.status === 'occupied' && (
            <button
              className="absolute top-1 right-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-lg transition-all z-20 hover:scale-110"
              onClick={(e) => handleInitiateTransfer(e, table)}
              title="Transfer Table"
            >
              <FaArrowsAlt className="text-xs" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading tables...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl max-w-md">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between mb-6 p-6 bg-white rounded-xl shadow-lg border border-border">
        <div className="flex text-center justify-between items-start mb-6">
          <div className='flex flex-col items-center justify-center'>
            <h2 className="text-3xl font-bold text-foreground mb-1">Table Management</h2>
            <p className="text-sm text-muted-foreground">Manage and organize your restaurant tables</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-lg">
            <h4 className="text-2xl font-bold text-accent mb-1">{getTableStats().available}</h4>
            <small className="text-muted-foreground font-medium text-sm">Available Tables</small>
          </div>
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-lg">
            <h4 className="text-2xl font-bold text-destructive mb-1">{getTableStats().occupied}</h4>
            <small className="text-muted-foreground font-medium text-sm">Occupied Tables</small>
          </div>
          <div className="bg-secondary/30 border-l-4 border-secondary p-4 rounded-lg">
            <h4 className="text-2xl font-bold text-foreground mb-1">{getTableStats().waitingForPayment}</h4>
            <small className="text-muted-foreground font-medium text-sm">Waiting for Payment</small>
          </div>
          <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-lg">
            <h4 className="text-2xl font-bold text-primary mb-1">{getTableStats().total}</h4>
            <small className="text-muted-foreground font-medium text-sm">Total Tables</small>
          </div>
        </div>
      </div>

      {/* Main Layout - Horizontal */}
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Controls */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg border border-border p-4 space-y-3">
            <h3 className="font-semibold text-foreground mb-2">Actions</h3>
            <button
              className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isEditMode 
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
              }`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? <FaUndo className="text-sm" /> : <FaEdit className="text-sm" />}
              {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
            </button>
            <button
              className="w-full px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-secondary/30 border border-primary hover:border-primary/20 transition-all font-medium flex items-center justify-center gap-2"
              onClick={() => setShowConfigModal(true)}
            >
              <FaCog className="text-sm" />
              Layout Settings
            </button>
            <button
              className="w-full px-4 py-2.5 bg-accent text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus className="text-sm" />
              New Table
            </button>
          </div>

          {/* Location Tabs */}
          {locations.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">Locations</h3>
              <div className="flex flex-col gap-2">
                {locations.map(location => (
                  <button
                    key={location._id}
                    className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedLocation === location._id
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'bg-muted text-foreground hover:bg-secondary/30 border border-primary hover:border-primary/20'
                    }`}
                    onClick={() => setSelectedLocation(location._id)}
                  >
                    <span className="text-lg">{location.icon}</span>
                    <span>{location.name}</span>
                  </button>
                ))}
                            <button
              className="mt-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all font-medium shadow-lg shadow-accent/25 flex items-center justify-center gap-2"
              onClick={() => setShowLocationManager(true)}
            >
              <FaMapMarkerAlt className="text-sm" />
              Manage Locations
            </button>
              </div>
            </div>
          )}

          {/* Edit Mode Notice */}
          {isEditMode && (
            <div className="p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl">
              <div className="flex items-start gap-2">
                <FaEdit className="text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong className="font-semibold">Edit Mode Active:</strong> You can drag and drop tables to rearrange them. 
                  Click on a table to edit its details.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Table Grid */}
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-lg border border-border p-6 overflow-auto">
          <div 
            id="table-container"
            className="relative bg-white rounded-xl overflow-hidden"
            style={{
              width: `${CONTAINER_WIDTH}px`,
              height: `${CONTAINER_HEIGHT}px`,
              minWidth: `${CONTAINER_WIDTH}px`,
              minHeight: `${CONTAINER_HEIGHT}px`,
              backgroundImage: isEditMode 
                ? `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px), linear-gradient(to right, var(--primary) 2px, transparent 2px), linear-gradient(to bottom, var(--primary) 2px, transparent 2px)`
                : 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
              backgroundSize: isEditMode 
                ? `${CONTAINER_WIDTH / gridConfig.cols}px ${CONTAINER_HEIGHT / gridConfig.rows}px, ${CONTAINER_WIDTH / gridConfig.cols}px ${CONTAINER_HEIGHT / gridConfig.rows}px, ${CONTAINER_WIDTH}px 2px, 2px ${CONTAINER_HEIGHT}px`
                : '20px 20px',
              backgroundPosition: isEditMode 
                ? `0 0, 0 0, ${CONTAINER_WIDTH/2}px 0, 0 ${CONTAINER_HEIGHT/2}px`
                : '0 0'
            }}
          >
            {tables.map(renderTable)}
            {isEditMode && (
              <div className="absolute top-4 right-4 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium border border-primary/20 backdrop-blur-sm z-50">
                Edit Mode - Drag tables to reposition
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-border">
            <h3 className="text-xl font-bold text-foreground mb-6">Add New Table</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Table Number</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Table Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="waiting_for_payment">Waiting for Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Table Shape</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.shape}
                  onChange={(e) => setFormData({...formData, shape: e.target.value})}
                >
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                >
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {location.icon} {location.name}
                    </option>
                  ))}
                </select>
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
                onClick={handleAddTable}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Table Modal */}
      {showTransferModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Transfer Table {selectedTable.number}
            </h3>
            <p className="text-muted-foreground mb-4">
              Select an available empty table to transfer this order to.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Target Table</label>
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                {tables
                  .filter(t => t.status === 'available' && t._id !== selectedTable._id)
                  .map(table => (
                    <button
                      key={table._id}
                      onClick={() => setTargetTableId(table._id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        targetTableId === table._id
                          ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary ring-offset-1'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="text-lg font-bold">{table.number}</div>
                      <div className="text-xs text-muted-foreground">{table.shape}</div>
                    </button>
                  ))}
              </div>
              {tables.filter(t => t.status === 'available' && t._id !== selectedTable._id).length === 0 && (
                <p className="text-destructive text-sm text-center py-2">No available tables found.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                onClick={() => setShowTransferModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={handleTransferTable}
                disabled={!targetTableId}
              >
                Transfer Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-border">
            <h3 className="text-xl font-bold text-foreground mb-6">Edit Table - Table {selectedTable?.number}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Table Number</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Table Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="waiting_for_payment">Waiting for Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Table Shape</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.shape}
                  onChange={(e) => setFormData({...formData, shape: e.target.value})}
                >
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                >
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {location.icon} {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium flex items-center gap-2"
                onClick={handleDeleteTable}
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
                  onClick={handleUpdateTable}
                >
                  <FaSave className="text-sm" />
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-border">
            <h3 className="text-xl font-bold text-foreground mb-6">Layout Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Grid Rows</label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={gridConfig.rows}
                    onChange={(e) => setGridConfig({...gridConfig, rows: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Grid Columns</label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-white"
                    value={gridConfig.cols}
                    onChange={(e) => setGridConfig({...gridConfig, cols: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Grid Information</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  • Container size: 800x600 pixels (fixed)<br/>
                  • Center point: (0, 0)<br/>
                  • Each table occupies 1x1 grid cell<br/>
                  • Cell size: {Math.round(CONTAINER_WIDTH / gridConfig.cols)}x{Math.round(CONTAINER_HEIGHT / gridConfig.rows)} pixels<br/>
                  • Grid range: X: {-Math.floor(gridConfig.cols/2)} to {Math.floor(gridConfig.cols/2)-1}, Y: {-Math.floor(gridConfig.rows/2)} to {Math.floor(gridConfig.rows/2)-1}<br/>
                  • Maximum tables: {gridConfig.rows * gridConfig.cols}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                onClick={() => setShowConfigModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/25"
                onClick={() => setShowConfigModal(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Manager Modal */}
      {showLocationManager && (
        <LocationManager
          onLocationChange={() => {
            fetchLocations();
            if (selectedLocation) {
              fetchTables(selectedLocation);
            }
          }}
          onClose={() => setShowLocationManager(false)}
        />
      )}

      {/* Table Order Manager Modal */}
      {showOrderManager && selectedTable && (
        <TableOrderManager
          key={selectedTable._id} // Force re-render for each table
          table={selectedTable}
          onClose={() => {
            setShowOrderManager(false);
            setSelectedTable(null);
          }}
          onOrderUpdate={() => {
            fetchTables(selectedLocation);
          }}
        />
      )}
      
    </div>
  );
};

export default TableGrid;