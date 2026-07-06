import React, { useState, useEffect } from 'react';
import { Users, Plus, Check, Search, Trash2, X, AlertTriangle, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { Tenant, Room, Property } from '../../types';

interface TenantsProps {
  selectedPropertyId: string;
  properties: Property[];
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function TenantsView({ selectedPropertyId, properties, showToast }: TenantsProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Checked Out'>('all');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedNumber, setBedNumber] = useState(1);
  const [rentAmount, setRentAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchTenantsAndRooms = async () => {
    try {
      setLoading(true);
      const [tenantList, roomList] = await Promise.all([
        api.getTenants(),
        api.getRooms(selectedPropertyId)
      ]);
      setTenants(tenantList);
      // Filter out full or maintenance rooms for allocation
      setRooms(roomList);
    } catch (err) {
      showToast("Failed to fetch records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantsAndRooms();
  }, [selectedPropertyId]);

  const handleRoomChange = (selectedRoomId: string) => {
    setRoomId(selectedRoomId);
    const room = rooms.find(r => r.id === selectedRoomId);
    if (room) {
      setRentAmount(room.price);
      setDepositAmount(room.price * 1.5); // Default deposit multiplier
      setBedNumber(room.occupiedBeds + 1);
    }
  };

  const openAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setIdProofType('Aadhaar Card');
    setIdProofNumber('');
    setRoomId('');
    setRentAmount(0);
    setDepositAmount(0);
    setEmergencyName('');
    setEmergencyRelation('');
    setEmergencyPhone('');
    setSelectedFile(null);
    
    // Auto trigger first available room details if any
    const availableRooms = rooms.filter(r => r.status === 'Available');
    if (availableRooms.length > 0) {
      handleRoomChange(availableRooms[0].id);
    }
    
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !roomId || !idProofNumber) {
      showToast("Please fill in all mandatory inputs", "warning");
      return;
    }

    try {
      let docUrl = null;
      if (selectedFile) {
        const uploadRes = await api.uploadDocument(selectedFile);
        docUrl = uploadRes.url;
      }

      const selectedRoom = rooms.find(r => r.id === roomId);

      const payload: Partial<Tenant> = {
        name,
        email,
        phone,
        idProofType,
        idProofNumber,
        docUrl,
        roomId,
        bedNumber,
        rentAmount,
        depositAmount,
        checkInDate: new Date().toISOString().substring(0, 10),
        checkOutDate: null,
        emergencyContact: {
          name: emergencyName,
          relation: emergencyRelation,
          phone: emergencyPhone
        },
        propertyId: selectedRoom ? selectedRoom.propertyId : ""
      };

      await api.createTenant(payload);
      showToast("Tenant checked-in and bill generated successfully!", "success");
      setShowAddModal(false);
      fetchTenantsAndRooms();
    } catch (err) {
      showToast("Registration failed", "error");
    }
  };

  const handleCheckout = async (id: string, tenantName: string) => {
    if (window.confirm(`Are you sure you want to perform a formal Check-Out for ${tenantName}? This will vacate the bed.`)) {
      try {
        await api.checkoutTenant(id);
        showToast("Tenant checked out successfully", "success");
        fetchTenantsAndRooms();
      } catch (err) {
        showToast("Check-out operation failed", "error");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to completely delete this tenant record? This is irreversible.")) {
      try {
        await api.deleteTenant(id);
        showToast("Tenant record removed", "success");
        fetchTenantsAndRooms();
      } catch (err) {
        showToast("Operation failed", "error");
      }
    }
  };

  // Filter list
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.phone.includes(searchTerm) || 
                          t.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesProp = selectedPropertyId === 'all' || t.propertyId === selectedPropertyId;
    return matchesSearch && matchesStatus && matchesProp;
  });

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tenant Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Register new residents, handle documentation, and track histories.</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Check-In Resident
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search name, phone, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'Active', 'Checked Out'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === status 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">No Residents Registered</h3>
          <p className="text-xs text-gray-400 mt-1">Add details of residents checking into your PG properties.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Room & Bed</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4">Documentation</th>
                <th className="px-6 py-4">Timeline</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-950 text-sm">{t.name}</h4>
                      <p className="text-gray-400 mt-0.5">{t.phone} &bull; {t.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800">Room {t.roomNumber}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">Bed No. {t.bedNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800">₹{t.rentAmount.toLocaleString('en-IN')}<span className="text-[10px] text-gray-400 font-semibold">/mo</span></span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">Deposit: ₹{t.depositAmount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                      {t.idProofType}
                    </span>
                    <span className="block font-mono text-[10px] text-gray-400 mt-1">{t.idProofNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Check-in: {t.checkInDate}
                      </span>
                      {t.checkOutDate ? (
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-400 shrink-0" /> Out: {t.checkOutDate}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[10px] uppercase bg-emerald-50 px-2 py-0.5 rounded-full inline-block w-fit">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status === 'Active' && (
                        <button
                          onClick={() => handleCheckout(t.id, t.name)}
                          className="px-3 py-1.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Resident Check-In Registration</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">1. Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Singh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Documentation */}
              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">2. Identity proof</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Proof Type</label>
                    <select
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 cursor-pointer"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">ID Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter identity number"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Upload Scanned Copy (PDF/JPG)</label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Room Allocation */}
              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">3. Room Bed Allocation</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Select Room *</label>
                    <select
                      value={roomId}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 cursor-pointer"
                    >
                      <option value="" disabled>-- Select a Room --</option>
                      {rooms.filter(r => r.status === 'Available').map(r => (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} ({r.type} - Bed {r.occupiedBeds + 1}/{r.totalBeds})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Monthly Rent</label>
                    <input
                      type="number"
                      required
                      value={rentAmount}
                      onChange={(e) => setRentAmount(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Security Deposit</label>
                    <input
                      type="number"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">4. Emergency Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Kumar"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Relation</label>
                    <input
                      type="text"
                      placeholder="e.g. Father, Guardian"
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      placeholder="+91 XXXXX XXXXX"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none"
                    />
                  </div>
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
                  Allocate Bed & Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
