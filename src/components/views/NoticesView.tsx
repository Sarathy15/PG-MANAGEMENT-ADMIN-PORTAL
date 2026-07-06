import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Trash2, X, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Notice } from '../../types';

interface NoticesProps {
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function NoticesView({ showToast }: NoticesProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'All' | 'Tenants' | 'Staff'>('All');
  const [status, setStatus] = useState<'Published' | 'Draft' | 'Expired'>('Published');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) {
      showToast("Failed to fetch announcements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showToast("Title and Content are required", "warning");
      return;
    }

    try {
      const payload: Partial<Notice> = {
        title,
        content,
        audience,
        status
      };

      await api.createNotice(payload);
      showToast("Notice published on bulletin boards", "success");
      setShowAddModal(false);
      fetchNotices();
    } catch (err) {
      showToast("Failed to post notice", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this notice?")) {
      try {
        await api.deleteNotice(id);
        showToast("Notice removed", "success");
        fetchNotices();
      } catch (err) {
        showToast("Operation failed", "error");
      }
    }
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bulletin & Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Broadcast important society alerts, food timing shifts, or holidays.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Post Notice
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
            placeholder="Search notice content or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      {/* Notices Board */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">Bulletin Board is Empty</h3>
          <p className="text-xs text-gray-400 mt-1">Broadcast announcements to keep residents and staff in the loop.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotices.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 group relative flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                      To: {n.audience}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      n.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {n.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">{n.title}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">{n.content}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Broadcast Date: {n.date}
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
              <h3 className="text-lg font-bold text-gray-900">Post Announcement Notice</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi router downtime"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                  >
                    <option value="All">All Audiences</option>
                    <option value="Tenants">Tenants Only</option>
                    <option value="Staff">Staff Members</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                  >
                    <option value="Published">Publish Live</option>
                    <option value="Draft">Save Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Notice Content / Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type important details, schedules or reminders clearly..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
