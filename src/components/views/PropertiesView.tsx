import React, { useState, useEffect } from 'react';
import { Building, MapPin, Phone, Mail, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Property } from '../../types';

interface PropertiesProps {
  properties: Property[];
  refreshProperties: () => Promise<void>;
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function PropertiesView({ properties, refreshProperties, showToast }: PropertiesProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const amenitiesList = ["Wi-Fi", "Daily Meals", "AC Rooms", "Laundry", "Gym", "Power Backup", "CCTV", "24/7 Security", "Fridge"];

  const openAddModal = () => {
    setEditingProperty(null);
    setName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setImage('');
    setSelectedAmenities([]);
    setShowAddModal(true);
  };

  const openEditModal = (prop: Property) => {
    setEditingProperty(prop);
    setName(prop.name);
    setAddress(prop.address);
    setPhone(prop.phone);
    setEmail(prop.email);
    setImage(prop.image || '');
    setSelectedAmenities(prop.amenities);
    setShowAddModal(true);
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone || !email) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    try {
      const payload = {
        name,
        address,
        phone,
        email,
        image: image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        amenities: selectedAmenities
      };

      if (editingProperty) {
        await api.updateProperty(editingProperty.id, payload);
        showToast("Property updated successfully", "success");
      } else {
        await api.createProperty(payload);
        showToast("Property created successfully", "success");
      }
      setShowAddModal(false);
      await refreshProperties();
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const handleDelete = async (id: string, propName: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete ${propName}? This will remove all associated statistics.`)) {
      try {
        await api.deleteProperty(id);
        showToast("Property deleted successfully", "success");
        await refreshProperties();
      } catch (err) {
        showToast("Failed to delete property", "error");
      }
    }
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Property Management</h1>
          <p className="text-sm text-gray-500 mt-1">Configure and manage your PG locations and services.</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {properties.length === 0 ? (
          <div className="lg:col-span-2 p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white">
            <Building className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-800 mt-4 text-sm">No Properties Found</h3>
            <p className="text-xs text-gray-400 mt-1">Get started by creating your very first Paying Guest building.</p>
          </div>
        ) : (
          properties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="md:w-48 h-48 md:h-full relative shrink-0 overflow-hidden">
                <img 
                  src={prop.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"} 
                  alt={prop.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-800 px-2.5 py-1 rounded-full shadow-sm">
                  {prop.id}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {prop.name}
                    </h3>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(prop)}
                        className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(prop.id, prop.name)}
                        className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {prop.address}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 font-medium">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {prop.phone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400 truncate" />
                      {prop.email}
                    </p>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="mt-6 border-t border-gray-50 pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {prop.amenities.map((amenity, idx) => (
                      <span key={idx} className="text-[10px] bg-gray-50 text-gray-600 font-semibold px-2 py-0.5 rounded-full border border-gray-100">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProperty ? "Modify PG Property" : "Add PG Property"}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Property Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Heights PG"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Complete Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street name, Sector, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@property.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
                />
              </div>

              {/* Amenities Grid */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Amenities</label>
                <div className="grid grid-cols-3 gap-2">
                  {amenitiesList.map((amenity, idx) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleAmenity(amenity)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {amenity}
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 ml-1 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
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
                  {editingProperty ? "Save Changes" : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
