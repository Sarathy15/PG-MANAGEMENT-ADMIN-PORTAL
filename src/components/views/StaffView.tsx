import React, { useState, useEffect } from 'react';
import { Plus, Check, Search, Trash2, X, ClipboardList, Briefcase, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import { Staff } from '../../types';

interface StaffProps {
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function StaffView({ showToast }: StaffProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Property Warden');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState(15000);
  const [shift, setShift] = useState<'Day' | 'Night' | 'Evening'>('Day');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getStaff();
      setStaffList(data);
    } catch (err) {
      showToast("Failed to fetch staff directory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      showToast("Name, Phone and Email are mandatory fields", "warning");
      return;
    }

    try {
      const payload: Partial<Staff> = {
        name,
        role,
        phone,
        email,
        salary: Number(salary),
        shift
      };

      await api.createStaff(payload);
      showToast("Staff registered successfully", "success");
      setShowAddModal(false);
      fetchStaff();
    } catch (err) {
      showToast("Failed to register staff", "error");
    }
  };

  const handleAttendanceChange = async (id: string, current: Staff, attendance: 'Present' | 'Absent' | 'On Leave') => {
    try {
      await api.updateStaff(id, { ...current, attendance });
      showToast(`Logged attendance as ${attendance} for ${current.name}`, "info");
      fetchStaff();
    } catch (err) {
      showToast("Failed to log attendance", "error");
    }
  };

  const handleDelete = async (id: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to remove ${staffName} from the PG staff directory?`)) {
      try {
        await api.deleteStaff(id);
        showToast("Staff record removed", "success");
        fetchStaff();
      } catch (err) {
        showToast("Failed to delete staff", "error");
      }
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Organize employee shifts, attendance rosters, and salary registries.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/15"
        >
          <Plus className="w-4 h-4" /> Add Employee
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
            placeholder="Search employee name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
          />
        </div>
      </div>

      {/* Staff Roster Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-56 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white max-w-xl mx-auto">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 mt-4 text-sm">No Employees Enrolled</h3>
          <p className="text-xs text-gray-400 mt-1">Register housekeeping, wardens, or security teams to run properties.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <div key={staff.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 relative group">
              
              {/* Profile Details */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                    {staff.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{staff.name}</h3>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{staff.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(staff.id, staff.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                  title="Remove Employee"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Contact and Salary */}
              <div className="space-y-2 text-xs text-gray-600 font-medium">
                <p>Phone: <span className="text-gray-800 font-semibold">{staff.phone}</span></p>
                <p>Email: <span className="text-gray-800 font-semibold">{staff.email}</span></p>
                <p>Shift: <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{staff.shift} Shift</span></p>
                <p>Salary: <span className="text-gray-900 font-extrabold">₹{staff.salary.toLocaleString('en-IN')}/mo</span></p>
              </div>

              {/* Interactive Attendance Toggle */}
              <div className="border-t border-gray-50 pt-4">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">
                  Daily Attendance
                </span>
                <div className="flex gap-1">
                  {(['Present', 'Absent', 'On Leave'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleAttendanceChange(staff.id, staff, status)}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border cursor-pointer transition-all ${
                        staff.attendance === status
                          ? status === 'Present' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            status === 'Absent' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      {status}
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
              <h3 className="text-lg font-bold text-gray-900">Add Staff Employee</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Employee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Department / Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                >
                  <option value="Property Warden">Property Warden</option>
                  <option value="Housekeeping Head">Housekeeping Head</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Maintenance Tech">Maintenance Tech</option>
                  <option value="Chef / Kitchen Staff">Chef / Kitchen Staff</option>
                </select>
              </div>

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
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="email@pgms.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Salary (INR)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Shift Duty</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                  >
                    <option value="Day">Day Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Evening">Evening Shift</option>
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
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
