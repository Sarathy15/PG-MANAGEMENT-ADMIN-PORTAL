import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, CheckCircle, Award, CreditCard, Activity } from 'lucide-react';
import { api } from '../../lib/api';
import { Tenant, Rent, Complaint, Property } from '../../types';

interface ReportsProps {
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function ReportsView({ showToast }: ReportsProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rents, setRents] = useState<Rent[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [t, r, c] = await Promise.all([
          api.getTenants(),
          api.getRent(),
          api.getComplaints()
        ]);
        setTenants(t);
        setRents(r);
        setComplaints(c);
      } catch (err) {
        showToast("Failed to compile analytics", "error");
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  // Simple CSV Exporter helper
  const exportToCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully downloaded ${filename}`, "success");
  };

  const handleExportTenants = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Status", "Room No", "Monthly Rent", "Check-in Date"];
    const rows = tenants.map(t => [
      t.id, t.name, t.email, t.phone, t.status, t.roomNumber, t.rentAmount.toString(), t.checkInDate
    ]);
    exportToCSV("pg_tenants_directory.csv", headers, rows);
  };

  const handleExportRentLedger = () => {
    const headers = ["Invoice ID", "Resident Name", "Room", "Period", "Amount", "Status", "Due Date", "Paid Date"];
    const rows = rents.map(r => [
      r.invoiceId, r.tenantName, r.roomNumber, r.month, r.amount.toString(), r.status, r.dueDate, r.paidDate || "Pending"
    ]);
    exportToCSV("pg_financial_ledger.csv", headers, rows);
  };

  const handleExportComplaints = () => {
    const headers = ["ID", "Reporter", "Room", "Title", "Category", "Priority", "Status", "Date"];
    const rows = complaints.map(c => [
      c.id, c.tenantName, c.roomNumber, c.title, c.category, c.priority, c.status, c.date
    ]);
    exportToCSV("pg_complaints_log.csv", headers, rows);
  };

  const totalCollected = rents.filter(r => r.status === 'Paid').reduce((acc, r) => acc + r.amount, 0);
  const totalPending = rents.filter(r => r.status === 'Pending').reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Ledger Exports</h1>
        <p className="text-sm text-gray-500 mt-1">Compile financial ledgers, audit checklists, and export database tables to Excel / CSV.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Completed Collections</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">₹{totalCollected.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Outstanding Receivables</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">₹{totalPending.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Roster Resolution Rate</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                  {complaints.length > 0 ? Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100) : 100}%
                </h3>
              </div>
            </div>
          </div>

          {/* Export Actions Panel */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-950">One-Click CSV / Spreadsheet Exports</h3>
              <p className="text-xs text-gray-500 mt-1">Download complete data logs instantly as formatted table files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Tenant roll */}
              <div className="p-6 border border-gray-100 bg-gray-50/50 hover:bg-gray-50 rounded-2xl flex flex-col justify-between h-48 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Resident Directory</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Contains details of current active checked-in residents, phone records, and dates.</p>
                </div>
                <button
                  onClick={handleExportTenants}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Directory
                </button>
              </div>

              {/* Rent roll */}
              <div className="p-6 border border-gray-100 bg-gray-50/50 hover:bg-gray-50 rounded-2xl flex flex-col justify-between h-48 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Financial Rent roll</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Contains invoices list, paid vs pending, amounts, and audit IDs.</p>
                </div>
                <button
                  onClick={handleExportRentLedger}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export Ledger Roll
                </button>
              </div>

              {/* Complaints */}
              <div className="p-6 border border-gray-100 bg-gray-50/50 hover:bg-gray-50 rounded-2xl flex flex-col justify-between h-48 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Service Tickets log</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Contains issues log, categories, priorities, dates, and resolved counters.</p>
                </div>
                <button
                  onClick={handleExportComplaints}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Service Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
