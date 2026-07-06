import React, { useState, useEffect } from 'react';
import { Plus, Check, Search, Trash2, X, Wrench, DollarSign, Calendar, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { Maintenance, Property, Room, Staff } from '../../types';

interface MaintenanceProps {
  selectedPropertyId: string;
  properties: Property[];
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function MaintenanceView({ selectedPropertyId, properties, showToast }: MaintenanceProps) {
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [cost, setCost] = useState(1000);
  const [description, setDescription] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mData, rData, sData] = await Promise.all([
        api.getMaintenance(),
        api.getRooms(selectedPropertyId),
        api.getStaff()
      ]);
      setMaintenanceList(mData);
      setRooms(rData);
      setStaffMembers(sData);
    } catch (err) {
      showToast("Failed to fetch maintenance orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (selectedPropertyId !== 'all') {
      setPropertyId(selectedPropertyId);
    } else if (properties.length > 0) {
      setPropertyId(properties[0].id);
    }
  }, [selectedPropertyId, properties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !propertyId) {
      showToast("Property, Title and Description are required", "warning");
      return;
    }

    try {
      const payload: Partial<Maintenance> = {
        propertyId,
        title,
        roomId: roomId || null,
        cost: Number(cost),
        description,
        assignedStaffId: assignedStaffId || null,
        status
      };

      await api.createMaintenance(payload);
      showToast("Maintenance order logged", "success");
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      showToast("Failed to log maintenance work", "error");
    }
  };

  const handleStatusChange = async (id: string, current: Maintenance, status: 'Pending' | 'In Progress' | 'Completed') => {
    try {
      await api.updateMaintenance(id, { ...current, status });
      showToast(`Work order marked as ${status}`, "success");
      fetchData();
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Clear this work order?")) {
      try {
        await api.deleteMaintenance(id);
        showToast("Work order removed", "success");
        fetchData();
      } catch (err) {
        showToast("Operation failed", "error");
      }
    }
  };

  // Filter
  const filteredMaintenance = maintenanceList.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProp = selectedPropertyId === 'all' || m.propertyId === selectedPropertyId;
    return matchesSearch && matchesProp;
  });

  const getStatusBadge = (status: 'Pending' | 'In Progress' | 'Completed') => {
    const classes = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-100',
      'In Progress': 'bg-blue-50 text-blue-700 border-blue-100',
      Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${classes[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Maintenance & Work Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Oversee machinery fixes, room painting, plumbing, and asset costs.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Create Work Order
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search work orders, repairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      {/* Maintenance Cards list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(n => (
            <div key={n} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredMaintenance.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">No Work Orders Logged</h3>
          <p className="text-xs text-gray-400 mt-1">Create maintenance jobs to track assets, repairs and contractor costs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMaintenance.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 group relative flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-mono font-bold">{m.id}</span>
                  <div className="flex gap-2 items-center">
                    {getStatusBadge(m.status)}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">{m.title}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{m.propertyName} {m.roomNumber ? `&bull; Room ${m.roomNumber}` : ''}</p>
                  <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">{m.description}</p>
                </div>
              </div>

              {/* Cost and Actions footer */}
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Cost: <span className="text-gray-900 font-extrabold">₹{m.cost.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex gap-1">
                  {(['Pending', 'In Progress', 'Completed'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(m.id, m, st)}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-all ${
                        m.status === st
                          ? 'bg-blue-600 text-white border-transparent'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {st === 'In Progress' ? 'Progress' : st}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add Maintenance Order</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Property Location *</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Work Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corridor painting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Associated Room (Optional)</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                >
                  <option value="">-- No Room (Common Area) --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Cost (INR) *</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Assigned Technician</label>
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                  >
                    <option value="">-- No technician --</option>
                    {staffMembers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Job Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe equipment repairs or plaster painting instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                />
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
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
