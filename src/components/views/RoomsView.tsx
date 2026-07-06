import React, { useState, useEffect } from 'react';
import { Bed, Plus, Filter, Pencil, Trash2, X, CheckCircle, Info, Hammer } from 'lucide-react';
import { api } from '../../lib/api';
import { Room, Property } from '../../types';

interface RoomsProps {
  selectedPropertyId: string;
  properties: Property[];
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function RoomsView({ selectedPropertyId, properties, showToast }: RoomsProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Filters
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [propertyId, setPropertyId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState(1);
  const [type, setType] = useState<'Single' | 'Double' | 'Triple' | 'Four-Sharing'>('Single');
  const [price, setPrice] = useState(8000);
  const [totalBeds, setTotalBeds] = useState(1);
  const [status, setStatus] = useState<'Available' | 'Full' | 'Maintenance'>('Available');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getRooms(selectedPropertyId);
      setRooms(data);
    } catch (err) {
      showToast("Failed to fetch rooms", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedPropertyId]);

  // Handle room form defaults when changing properties
  useEffect(() => {
    if (properties.length > 0) {
      setPropertyId(properties[0].id);
    }
  }, [properties]);

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setFloor(1);
    setType('Single');
    setPrice(8000);
    setTotalBeds(1);
    setStatus('Available');
    if (selectedPropertyId !== 'all') {
      setPropertyId(selectedPropertyId);
    } else if (properties.length > 0) {
      setPropertyId(properties[0].id);
    }
    setShowAddModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setPropertyId(room.propertyId);
    setRoomNumber(room.roomNumber);
    setFloor(room.floor);
    setType(room.type);
    setPrice(room.price);
    setTotalBeds(room.totalBeds);
    setStatus(room.status);
    setShowAddModal(true);
  };

  // Set default bed size based on room type
  const handleTypeChange = (selectedType: any) => {
    setType(selectedType);
    if (selectedType === 'Single') {
      setTotalBeds(1);
      setPrice(12000);
    } else if (selectedType === 'Double') {
      setTotalBeds(2);
      setPrice(8000);
    } else if (selectedType === 'Triple') {
      setTotalBeds(3);
      setPrice(6000);
    } else {
      setTotalBeds(4);
      setPrice(5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber || !price) {
      showToast("Room number and price are required", "warning");
      return;
    }

    try {
      const payload = {
        propertyId,
        roomNumber,
        floor: Number(floor),
        type,
        price: Number(price),
        totalBeds: Number(totalBeds),
        status
      };

      if (editingRoom) {
        await api.updateRoom(editingRoom.id, payload);
        showToast("Room information updated", "success");
      } else {
        await api.createRoom(payload);
        showToast("Room successfully registered", "success");
      }
      setShowAddModal(false);
      fetchRooms();
    } catch (err) {
      showToast("Failed to save room details", "error");
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (window.confirm(`Are you sure you want to delete Room ${number}?`)) {
      try {
        await api.deleteRoom(id);
        showToast("Room record deleted", "success");
        fetchRooms();
      } catch (err) {
        showToast("Failed to remove room", "error");
      }
    }
  };

  // Extract unique floors for filters
  const uniqueFloors = Array.from(new Set<number>(rooms.map(r => Number(r.floor)))).sort((a, b) => a - b);

  // Filter logic
  const filteredRooms = rooms.filter(room => {
    const floorMatch = floorFilter === 'all' || room.floor === Number(floorFilter);
    const typeMatch = typeFilter === 'all' || room.type === typeFilter;
    const statusMatch = statusFilter === 'all' || room.status === statusFilter;
    return floorMatch && typeMatch && statusMatch;
  });

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Room Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor bed capacities, floor grids, and statuses.</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Register Room
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mr-2 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" /> Filters
        </div>

        {/* Floor selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500">Floor:</span>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Floors</option>
            {uniqueFloors.map(f => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>
        </div>

        {/* Sharing Type selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500">Sharing:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Single">Single Sharing</option>
            <option value="Double">Double Sharing</option>
            <option value="Triple">Triple Sharing</option>
            <option value="Four-Sharing">Four Sharing</option>
          </select>
        </div>

        {/* Availability status selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Full">Fully Occupied</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <Bed className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">No Rooms Meet the Filter</h3>
          <p className="text-xs text-gray-400 mt-1">Try modifying your filter selections or register a new room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRooms.map((room) => {
            const propName = properties.find(p => p.id === room.propertyId)?.name || "PG Property";
            return (
              <div key={room.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{propName}</span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">Room {room.roomNumber}</h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">Floor {room.floor} &bull; {room.type}</p>
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity duration-200">
                    <button 
                      onClick={() => openEditModal(room)}
                      className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(room.id, room.roomNumber)}
                      className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Beds allocation indicator */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2">
                    <span>Beds Allocated</span>
                    <span className="text-gray-900 font-bold">{room.occupiedBeds} / {room.totalBeds}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                    {Array.from({ length: room.totalBeds }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-full flex-1 transition-colors ${
                          room.status === 'Maintenance' ? 'bg-red-300' :
                          i < room.occupiedBeds ? 'bg-blue-600' : 'bg-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Price and Status Row */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-600">
                    ₹{room.price.toLocaleString('en-IN')}<span className="text-[10px] text-gray-400 font-semibold">/mo</span>
                  </span>

                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    room.status === 'Full' ? 'bg-red-50 text-red-700' :
                    room.status === 'Maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {room.status === 'Full' && <Info className="w-3 h-3" />}
                    {room.status === 'Available' && <CheckCircle className="w-3 h-3" />}
                    {room.status === 'Maintenance' && <Hammer className="w-3 h-3" />}
                    {room.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingRoom ? "Modify Room Details" : "Register New Room"}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select property */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Target PG Property *</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700 cursor-pointer"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Floor *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                  />
                </div>
              </div>

              {/* Room sharing type */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Sharing Type</label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700 cursor-pointer"
                >
                  <option value="Single">Single Sharing (1 Bed)</option>
                  <option value="Double">Double Sharing (2 Beds)</option>
                  <option value="Triple">Triple Sharing (3 Beds)</option>
                  <option value="Four-Sharing">Four Sharing (4 Beds)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Total Beds</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Rent/mo (INR) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                  />
                </div>
              </div>

              {/* Service Status */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Service Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700 cursor-pointer"
                >
                  <option value="Available">Available for booking</option>
                  <option value="Full">Mark Fully Occupied</option>
                  <option value="Maintenance">Under Maintenance</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
                >
                  {editingRoom ? "Save Room" : "Register Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
