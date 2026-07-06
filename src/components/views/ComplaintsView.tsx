import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Search, MessageSquare, ClipboardList, Trash2, X, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Complaint, Tenant, Staff } from '../../types';

interface ComplaintsProps {
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function ComplaintsView({ showToast }: ComplaintsProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [tenantId, setTenantId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Plumbing' | 'Electrical' | 'Internet' | 'Cleaning' | 'Food' | 'Other'>('Electrical');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Comment state
  const [activeCommentsId, setActiveCommentsId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [cData, tData, sData] = await Promise.all([
        api.getComplaints(),
        api.getTenants(),
        api.getStaff()
      ]);
      setComplaints(cData);
      setTenants(tData);
      setStaffMembers(sData);
    } catch (err) {
      showToast("Failed to load complaints tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !title || !description) {
      showToast("Tenant, Title and Description are required", "warning");
      return;
    }

    try {
      const payload: Partial<Complaint> = {
        tenantId,
        title,
        description,
        category,
        priority
      };
      await api.createComplaint(payload);
      showToast("Complaint registered and assigned to queue", "success");
      setShowAddModal(false);
      fetchAllData();
    } catch (err) {
      showToast("Failed to log complaint", "error");
    }
  };

  const handleStatusChange = async (id: string, current: Complaint, status: 'Pending' | 'In Progress' | 'Resolved') => {
    try {
      await api.updateComplaint(id, { ...current, status });
      showToast(`Complaint status updated to ${status}`, "success");
      fetchAllData();
    } catch (err) {
      showToast("Status transition failed", "error");
    }
  };

  const handleAssignStaff = async (id: string, current: Complaint, assignedStaffId: string) => {
    try {
      await api.updateComplaint(id, { ...current, assignedStaffId });
      showToast(`Assigned technical staff to ticket`, "success");
      fetchAllData();
    } catch (err) {
      showToast("Failed to assign staff", "error");
    }
  };

  const handleAddComment = async (id: string) => {
    if (!newCommentText.trim()) return;
    try {
      await api.addComplaintComment(id, newCommentText);
      setNewCommentText('');
      showToast("Response recorded", "success");
      fetchAllData();
    } catch (err) {
      showToast("Failed to post comment", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this complaint ticket?")) {
      try {
        await api.deleteComplaint(id);
        showToast("Ticket deleted", "success");
        fetchAllData();
      } catch (err) {
        showToast("Operation failed", "error");
      }
    }
  };

  // Filters
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.roomNumber.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resident Complaints</h1>
          <p className="text-sm text-gray-500 mt-1">Track resolution timelines, assign maintenance staff, and respond to tickets.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Register Ticket
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search Resident, Room, Keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Internet">Internet</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Food">Food</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(n => (
            <div key={n} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">No Active Tickets</h3>
          <p className="text-xs text-gray-400 mt-1">Residents' issues and maintenance work requests appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredComplaints.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 relative group flex flex-col justify-between">
              
              <div className="space-y-3">
                {/* Priority, category and actions */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      c.priority === 'High' ? 'bg-red-500' :
                      c.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold uppercase px-2 py-0.5 rounded-full">
                      {c.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Complaint Title */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">{c.title}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{c.description}</p>
                </div>

                {/* Tenant info */}
                <div className="flex justify-between text-xs font-semibold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span>By: <strong className="text-gray-800">{c.tenantName}</strong></span>
                  <span>Room: <strong className="text-gray-800">{c.roomNumber}</strong></span>
                </div>
              </div>

              {/* Assignments and Status updates */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {/* Technical staff assignment */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Staff Assigned:</span>
                  <select
                    value={c.assignedStaffId || ""}
                    onChange={(e) => handleAssignStaff(c.id, c, e.target.value)}
                    className="text-xs font-semibold text-gray-700 border border-gray-100 rounded-lg px-2 py-1 bg-white cursor-pointer"
                  >
                    <option value="" disabled>-- Assign Staff --</option>
                    {staffMembers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="font-bold text-gray-700">Roster Status:</span>
                  <div className="flex gap-1.5">
                    {(['Pending', 'In Progress', 'Resolved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(c.id, c, st)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border ${
                          c.status === st
                            ? st === 'Resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              st === 'In Progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                              'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment thread collapse */}
                <div className="pt-2">
                  <button
                    onClick={() => setActiveCommentsId(activeCommentsId === c.id ? null : c.id)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> 
                    {c.comments.length} Update Thread
                  </button>

                  {activeCommentsId === c.id && (
                    <div className="mt-3 space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-xs">
                      {c.comments.map((comment, i) => (
                        <div key={i} className="p-2 border-b border-gray-50 bg-white rounded-lg">
                          {comment}
                        </div>
                      ))}
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type resolution notes..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddComment(c.id)}
                          className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
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
              <h3 className="text-lg font-bold text-gray-900">File New Complaint</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Resident Reporter *</label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                >
                  <option value="" disabled>-- Select Resident --</option>
                  {tenants.filter(t => t.status === 'Active').map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Room {t.roomNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Complaint Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toilet faucet loose"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise details of the plumbing or wiring issue"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Internet">Internet</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Food">Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
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
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  File Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
