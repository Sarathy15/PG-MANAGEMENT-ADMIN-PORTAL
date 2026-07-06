import React, { useState, useEffect } from 'react';
import { Eye, Plus, Search, CheckCircle, Clock, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Visitor, Tenant } from '../../types';

interface VisitorsProps {
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function VisitorsView({ showToast }: VisitorsProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [hostTenantId, setHostTenantId] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [purpose, setPurpose] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const [vData, tData] = await Promise.all([
        api.getVisitors(),
        api.getTenants()
      ]);
      setVisitors(vData);
      setTenants(tData);
    } catch (err) {
      showToast("Failed to fetch logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !hostTenantId || !phone || !purpose) {
      showToast("All fields are mandatory", "warning");
      return;
    }

    try {
      const payload: Partial<Visitor> = {
        name,
        hostTenantId,
        phone,
        relation,
        purpose
      };
      await api.createVisitor(payload);
      showToast("Visitor entry logged and approved", "success");
      setShowAddModal(false);
      fetchRecords();
    } catch (err) {
      showToast("Failed to log visitor", "error");
    }
  };

  const handleCheckout = async (id: string, visitorName: string) => {
    try {
      await api.checkoutVisitor(id);
      showToast(`Visitor ${visitorName} checked-out successfully`, "success");
      fetchRecords();
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteVisitor(id);
      showToast("Log entry cleared", "success");
      fetchRecords();
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.hostTenantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Visitor Management</h1>
          <p className="text-sm text-gray-500 mt-1">Record gate entries, coordinate host approvals, and log exits.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Guest Check-In
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
            placeholder="Search visitor name or host resident..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
          />
        </div>
      </div>

      {/* Visitors Logs List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredVisitors.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <Eye className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">No Active Visitor Logs</h3>
          <p className="text-xs text-gray-400 mt-1">Gate guest logins appear here once entries are registered.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Host Resident</th>
                <th className="px-6 py-4">Relationship</th>
                <th className="px-6 py-4">In Time</th>
                <th className="px-6 py-4">Out Time</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
              {filteredVisitors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <h4 className="font-bold text-gray-900">{v.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{v.phone}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {v.hostTenantName}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-500">
                    {v.relation}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-semibold">
                    {v.checkIn}
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-medium">
                    {v.checkOut || '--:--'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium max-w-xs truncate">
                    {v.purpose}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      v.status === 'Checked Out' 
                        ? 'bg-gray-100 text-gray-600 border-gray-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {v.status === 'Approved' && (
                        <button
                          onClick={() => handleCheckout(v.id, v.name)}
                          className="px-2.5 py-1.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Checkout Guest
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Guest Register Check-In</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Host Resident *</label>
                <select
                  value={hostTenantId}
                  onChange={(e) => setHostTenantId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                >
                  <option value="" disabled>-- Select Host Resident --</option>
                  {tenants.filter(t => t.status === 'Active').map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Room {t.roomNumber})</option>
                  ))}
                </select>
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
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Relation / Association</label>
                  <input
                    type="text"
                    placeholder="e.g. Brother, Friend"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic study, Dinner delivery"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
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
                  Register Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
