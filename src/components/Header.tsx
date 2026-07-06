import { useState, useEffect } from 'react';
import { Search, Bell, Calendar, Building, CheckCircle } from 'lucide-react';
import { Property } from '../types';

interface HeaderProps {
  properties: Property[];
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  title: string;
}

export default function Header({ properties, selectedPropertyId, setSelectedPropertyId, title }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Rent pending from Priya Nair (Room 102)", read: false },
    { id: 2, text: "High Priority Complaint registered by Vikram Malhotra", read: false }
  ]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    // Elegant dynamic display time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
      {/* Title & Property Selector */}
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">{title}</h2>
        </div>

        <div className="h-5 w-[1px] bg-gray-200"></div>

        {/* Property Selector */}
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400" />
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="text-sm font-semibold text-gray-700 bg-transparent border-none hover:text-blue-600 cursor-pointer focus:outline-none pr-6 pl-1 focus:ring-0"
          >
            <option value="all">All Properties</option>
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Tools: Time, Search, Notifications */}
      <div className="flex items-center gap-5">
        {/* Modern Date Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {currentTime}
        </div>

        {/* Search Bar */}
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Global search..."
            className="w-full text-sm pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-700"
          />
        </div>

        {/* Notification Bell with Custom Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors relative text-gray-500 hover:text-gray-900"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">No new notices.</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b border-gray-50 text-xs text-gray-600 flex items-start gap-2.5 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></span>
                      <div>
                        <p className={!n.read ? "font-semibold text-gray-800" : ""}>{n.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
