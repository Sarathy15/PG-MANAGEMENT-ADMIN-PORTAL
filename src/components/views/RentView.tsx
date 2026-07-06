import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, CheckCircle, Search, Download, Clock, Printer, X, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { Rent, Property, Tenant } from '../../types';

interface RentProps {
  selectedPropertyId: string;
  properties: Property[];
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function RentView({ selectedPropertyId, properties, showToast }: RentProps) {
  const [rentEntries, setRentEntries] = useState<Rent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Overdue'>('all');
  const [activeReceipt, setActiveReceipt] = useState<Rent | null>(null);

  // Bill Generation States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [billingMonth, setBillingMonth] = useState('2026-07');

  const fetchRentLedger = async () => {
    try {
      setLoading(true);
      const data = await api.getRent();
      setRentEntries(data);
    } catch (err) {
      showToast("Failed to fetch rent ledger", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentLedger();
  }, [selectedPropertyId]);

  const handlePayRent = async (id: string, amount: number, name: string) => {
    if (window.confirm(`Log payment of ₹${amount.toLocaleString('en-IN')} as Paid by ${name}?`)) {
      try {
        await api.payRent(id);
        showToast("Payment successfully logged!", "success");
        fetchRentLedger();
      } catch (err) {
        showToast("Failed to complete transaction", "error");
      }
    }
  };

  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateRentBills(billingMonth);
      if (res.count > 0) {
        showToast(`Successfully generated ${res.count} monthly invoices.`, "success");
        setShowBulkModal(false);
        fetchRentLedger();
      } else {
        showToast("Invoices already exist for all residents for this month.", "info");
      }
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  // Filters
  const filteredRent = rentEntries.filter(entry => {
    const matchesSearch = entry.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.roomNumber.includes(searchTerm) ||
                          entry.invoiceId.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: 'Paid' | 'Pending' | 'Overdue') => {
    const classes = {
      Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      Pending: 'bg-amber-50 text-amber-700 border-amber-100',
      Overdue: 'bg-red-50 text-red-700 border-red-100'
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${classes[status]}`}>
        {status}
      </span>
    );
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rent & Invoice Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Track payments, create bills in bulk, and download invoice receipts.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
          >
            <Plus className="w-4 h-4" /> Generate Monthly Bills
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search Resident, Room, Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'Paid', 'Pending', 'Overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === status 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'All Invoices' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredRent.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">No Invoices Found</h3>
          <p className="text-xs text-gray-400 mt-1">Generate rent bills or register active residents to populate ledger entries.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Room No.</th>
                <th className="px-6 py-4">Billing Month</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
              {filteredRent.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                    {entry.invoiceId}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-950">
                    {entry.tenantName}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    Room {entry.roomNumber}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-600">
                    {entry.month}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {entry.dueDate}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₹{entry.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {entry.status !== 'Paid' && (
                        <button
                          onClick={() => handlePayRent(entry.id, entry.amount, entry.tenantName)}
                          className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors"
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        onClick={() => setActiveReceipt(entry)}
                        className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg cursor-pointer"
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Generator Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Bulk Invoice Generator</h3>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBills} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Select Billing Cycle *</label>
                <input
                  type="month"
                  required
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-xl text-xs text-blue-800 leading-relaxed">
                This will automatically create a <strong>Pending Rent Invoice</strong> for every active resident inside the current PG directory based on their room's price.
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
                >
                  Generate Bills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Receipt Popup */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-gray-100 text-gray-800 print:border-none print:shadow-none">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold uppercase px-2.5 py-1 rounded-full">
                Rent Invoice Receipt
              </span>
              <button 
                onClick={() => setActiveReceipt(null)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt template */}
            <div className="space-y-6 text-center border-b border-dashed border-gray-100 pb-6">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-md">
                P
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Elite PG Management Co.</h3>
                <p className="text-xs text-gray-400 mt-1">Official Payment Receipt & Bill</p>
              </div>
            </div>

            <div className="space-y-4 py-6 border-b border-dashed border-gray-100 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Invoice ID</span>
                <span className="font-mono font-bold text-gray-800">{activeReceipt.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Resident Name</span>
                <span className="font-bold text-gray-800">{activeReceipt.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Room Number</span>
                <span className="font-bold text-gray-800">Room {activeReceipt.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Billing Period</span>
                <span className="font-bold text-gray-800">{activeReceipt.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Payment Status</span>
                <span className={`font-bold ${activeReceipt.status === 'Paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {activeReceipt.status}
                </span>
              </div>
              {activeReceipt.paidDate && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-400">Receipt Date</span>
                  <span className="font-bold text-gray-800">{activeReceipt.paidDate}</span>
                </div>
              )}
            </div>

            <div className="py-6 text-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Total Amount</span>
              <h2 className="text-3xl font-black text-gray-900 mt-1">
                ₹{activeReceipt.amount.toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-50 print:hidden">
              <button
                onClick={printReceipt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
