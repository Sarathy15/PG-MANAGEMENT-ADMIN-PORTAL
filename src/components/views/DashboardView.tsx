import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, HelpCircle, TrendingUp, DollarSign, 
  ArrowUpRight, AlertCircle, Megaphone, Plus, Bed, LogIn, Eye, ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { Property, AuditLog, Complaint, Notice } from '../../types';

interface DashboardProps {
  selectedPropertyId: string;
  properties: Property[];
  setView: (view: string) => void;
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function DashboardView({ selectedPropertyId, properties, setView, showToast }: DashboardProps) {
  const [stats, setStats] = useState<{
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    occupancyRate: number;
    totalRevenue: number;
    pendingRent: number;
    activeComplaints: number;
    recentActivity: AuditLog[];
    recentComplaints: Complaint[];
    visitorCount: number;
    notices: Notice[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getDashboardStats(selectedPropertyId);
        setStats(data);
      } catch (err) {
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedPropertyId]);

  if (loading || !stats) {
    return (
      <div className="flex-1 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
          <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Modern SVG Line Chart for revenue visual
  // Predefined custom points based on data (SaaS style)
  const chartPoints = "10,90 40,75 70,80 100,55 130,40 160,30 190,15";

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-gray-50/30">
      {/* Overview Headings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Overview Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">Here is a real-time health summary for your PG network.</p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">
        
        {/* KPI Stats Cards - Row 1 (span-3 each) */}
        
        {/* Occupancy Card */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Occupancy Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bed className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">{stats.occupancyRate}%</span>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                {stats.occupiedBeds} / {stats.totalBeds} beds filled
              </p>
            </div>
            <span className="text-green-600 text-[10px] font-bold bg-green-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +2.4%
            </span>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(stats.totalRevenue)}</span>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">Total Collections</p>
            </div>
            <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
              +12%
            </span>
          </div>
        </div>

        {/* Pending Rent Card */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Pending Rent</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-red-600 tracking-tight">{formatCurrency(stats.pendingRent)}</span>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">Awaiting collection</p>
            </div>
            <span className="text-amber-700 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded-md">
              8 Tenants
            </span>
          </div>
        </div>

        {/* Active Complaints Card */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Open Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HelpCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">{stats.activeComplaints}</span>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">Active support tickets</p>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              stats.activeComplaints > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {stats.activeComplaints > 0 ? "4 Critical" : "All Clear"}
            </span>
          </div>
        </div>

        {/* Revenue stream analysis - Row 2 (span-8) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-gray-950 text-sm tracking-tight">Rent Collection Analysis</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Historical and projected rent collections</p>
              </div>
              <div className="flex gap-1">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold">Weekly</span>
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold">Monthly</span>
              </div>
            </div>
            
            {/* Shaded Area Graph */}
            <div className="w-full h-52 relative flex items-end">
              <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15"/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Grids */}
                <line x1="0" y1="20" x2="200" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="200" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="80" x2="200" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />
                
                {/* Shaded Area */}
                <path d={`M10,100 L${chartPoints.replace('190,15', '190,100')}`} fill="url(#chartGrad)" />
                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  points={chartPoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              
              {/* Floating Labels */}
              <div className="absolute top-2 right-4 text-[10px] bg-gray-900 text-white font-extrabold px-2 py-0.5 rounded shadow-sm pointer-events-none">
                Peak: {formatCurrency(stats.totalRevenue + 15000)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-4 px-2 border-t border-gray-50 pt-3">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span className="text-blue-600 font-extrabold">Jul (Current)</span>
          </div>
        </div>

        {/* Quick Management - Row 2 (span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-gray-950 text-sm tracking-tight">Quick Management</h3>
            <div className="space-y-2.5">
              <button 
                onClick={() => setView('tenants')} 
                className="w-full flex items-center justify-between p-3 bg-gray-50/55 border border-gray-100 hover:border-blue-300 hover:bg-blue-50/10 rounded-xl group transition-all cursor-pointer text-left"
              >
                <span className="text-xs font-bold text-gray-700">Add New Tenant</span>
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:rotate-90 transition-all shrink-0" />
              </button>
              <button 
                onClick={() => setView('maintenance')} 
                className="w-full flex items-center justify-between p-3 bg-gray-50/55 border border-gray-100 hover:border-blue-300 hover:bg-blue-50/10 rounded-xl group transition-all cursor-pointer text-left"
              >
                <span className="text-xs font-bold text-gray-700">Create Maintenance Task</span>
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:rotate-90 transition-all shrink-0" />
              </button>
              <button 
                onClick={() => setView('notices')} 
                className="w-full flex items-center justify-between p-3 bg-gray-50/55 border border-gray-100 hover:border-blue-300 hover:bg-blue-50/10 rounded-xl group transition-all cursor-pointer text-left"
              >
                <span className="text-xs font-bold text-gray-700">Broadcast Notice</span>
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:rotate-90 transition-all shrink-0" />
              </button>
            </div>
          </div>

          <div className="mt-5 p-4 bg-blue-50/60 border border-blue-100/30 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Live Activity</span>
            </div>
            <p className="text-[11px] text-blue-600 leading-snug font-semibold">
              {stats.recentActivity && stats.recentActivity.length > 0 
                ? stats.recentActivity[0].details 
                : "Tenant Rahul Roy just paid ₹18,500 via UPI"}
            </p>
          </div>
        </div>

        {/* Notices Board - Row 3 (span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-950 text-sm tracking-tight">Active Notice Board</h3>
              <Megaphone className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
            
            <div className="space-y-3">
              {stats.notices.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No announcements published.</div>
              ) : (
                stats.notices.slice(0, 2).map((notice) => (
                  <div key={notice.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-bold uppercase px-1.5 py-0.5 rounded-md">
                        {notice.audience}
                      </span>
                      <span className="text-[9px] text-gray-400 font-semibold">{notice.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 mt-1.5">{notice.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{notice.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => setView('notices')} 
            className="w-full mt-4 text-center text-[11px] text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer border-t border-gray-50 pt-3 block"
          >
            Create Announcement &rarr;
          </button>
        </div>

        {/* Recent Audit Logs - Row 3 (span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-950 text-sm tracking-tight">Recent Audit Logs</h3>
              <span className="text-[9px] bg-gray-100 text-gray-600 font-extrabold uppercase px-2 py-0.5 rounded-md">
                Operations
              </span>
            </div>

            <div className="flow-root max-h-[220px] overflow-y-auto pr-1">
              <ul className="-mb-8">
                {stats.recentActivity.slice(0, 3).map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-6">
                      {logIdx !== Math.min(stats.recentActivity.length, 3) - 1 ? (
                        <span className="absolute top-4 left-3 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-2.5">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white shrink-0 ${
                          log.action.includes('ADD') ? 'bg-emerald-50 text-emerald-600' :
                          log.action.includes('DELETE') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {log.action.includes('ADD') ? <Plus className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        </span>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[11px] font-semibold text-gray-800 line-clamp-1">{log.details}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[9px] text-gray-400">By {log.userName}</span>
                            <span className="text-[9px] text-gray-400 font-medium">{log.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button 
            onClick={() => setView('reports')} 
            className="w-full mt-4 text-center text-[11px] text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer border-t border-gray-50 pt-3 block"
          >
            System Report Center &rarr;
          </button>
        </div>

        {/* Live Complaint Actions/Urgent Tickets - Row 3 (span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-950 text-sm tracking-tight">Urgent Tickets</h3>
              <button 
                onClick={() => setView('complaints')} 
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {stats.recentComplaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No active tickets filed.</div>
              ) : (
                stats.recentComplaints.slice(0, 2).map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-gray-100 flex items-start gap-2.5 hover:bg-gray-50 transition-colors">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                      c.priority === 'High' ? 'bg-red-500' :
                      c.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[11px] font-bold text-gray-800 truncate">{c.title}</h4>
                        <span className="text-[9px] text-gray-400 font-semibold shrink-0">Room {c.roomNumber}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{c.description}</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                        <span className="text-[9px] text-gray-400">{c.date}</span>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                          c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                          c.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => setView('complaints')} 
            className="w-full mt-4 text-center text-[11px] text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer border-t border-gray-50 pt-3 block"
          >
            Resolution Queue &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
