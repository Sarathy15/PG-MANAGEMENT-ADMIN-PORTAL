import React, { useState } from 'react';
import { Settings, Shield, Building, Bell, User, Lock, Save } from 'lucide-react';

interface SettingsProps {
  showToast: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function SettingsView({ showToast }: SettingsProps) {
  const [orgName, setOrgName] = useState('Elite PG Accommodations');
  const [contactEmail, setContactEmail] = useState('contact@elitepgs.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('102, HSR Layout, Sector 4, Bangalore, KA');
  const [currency, setCurrency] = useState('INR');
  
  // Notification configs
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("System settings saved successfully!", "success");
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your organization profile, SMS/WhatsApp notification channels, and currencies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Navigation panel */}
        <div className="space-y-2 lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold text-left cursor-pointer transition-colors">
              <Building className="w-4 h-4" /> Organization Details
            </button>
            <button onClick={() => showToast("Role management is a master-admin module.", "info")} className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl text-xs font-bold text-left cursor-pointer transition-colors">
              <Shield className="w-4 h-4" /> Roles & Security
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl text-xs font-bold text-left cursor-pointer transition-colors">
              <Bell className="w-4 h-4" /> Notification Rules
            </button>
          </div>
        </div>

        {/* Input Form panel */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
            
            {/* Org Profile */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-50 pb-2">Organization Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Company / Brand Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Billing Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Corporate Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Support Helpline</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Corporate Headquarters Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                />
              </div>
            </div>

            {/* Notifications switches */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide pb-2">Automation Alert Rules</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-xs text-gray-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Dispatch automated PDF bills to Resident Email upon generation</span>
                </label>

                <label className="flex items-center gap-3 text-xs text-gray-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifySms}
                    onChange={(e) => setNotifySms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Send urgent pending reminders via SMS gateway</span>
                </label>

                <label className="flex items-center gap-3 text-xs text-gray-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyWhatsApp}
                    onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Broadcast society bulletin board cards over WhatsApp Business API</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm shadow-blue-500/15"
              >
                <Save className="w-4 h-4" /> Save System Settings
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
