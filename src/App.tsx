import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './lib/api';
import { Property, User } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast, { ToastMessage, ToastType } from './components/Toast';

// Views
import DashboardView from './components/views/DashboardView';
import PropertiesView from './components/views/PropertiesView';
import RoomsView from './components/views/RoomsView';
import TenantsView from './components/views/TenantsView';
import RentView from './components/views/RentView';
import StaffView from './components/views/StaffView';
import VisitorsView from './components/views/VisitorsView';
import ComplaintsView from './components/views/ComplaintsView';
import MaintenanceView from './components/views/MaintenanceView';
import NoticesView from './components/views/NoticesView';
import ReportsView from './components/views/ReportsView';
import SettingsView from './components/views/SettingsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [currentView, setView] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Login form states
  const [email, setEmail] = useState('admin@pg.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);

  // Toast dispatch helper
  const showToast = (text: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Bootstrap session and properties
  const bootstrapSession = async () => {
    try {
      setLoading(true);
      const res = await api.me();
      if (res && res.user) {
        setCurrentUser(res.user);
        const propList = await api.getProperties();
        setProperties(propList);
        if (propList.length > 0) {
          setSelectedPropertyId('all'); // default to all properties
        }
      }
    } catch (err) {
      // Not logged in, that's fine
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrapSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.login(email, password);
      localStorage.setItem("pgms_token", res.token);
      setCurrentUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, "success");
      const propList = await api.getProperties();
      setProperties(propList);
    } catch (err: any) {
      showToast(err.message || "Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("pgms_token");
    setCurrentUser(null);
    setProperties([]);
    showToast("Signed out successfully", "info");
  };

  // Render current active view component dynamically
  const renderView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            selectedPropertyId={selectedPropertyId} 
            properties={properties}
            setView={setView}
            showToast={showToast} 
          />
        );
      case 'properties':
        return (
          <PropertiesView 
            properties={properties} 
            refreshProperties={async () => {
              const list = await api.getProperties();
              setProperties(list);
            }} 
            showToast={showToast} 
          />
        );
      case 'rooms':
        return (
          <RoomsView 
            selectedPropertyId={selectedPropertyId} 
            properties={properties} 
            showToast={showToast} 
          />
        );
      case 'tenants':
        return (
          <TenantsView 
            selectedPropertyId={selectedPropertyId} 
            properties={properties} 
            showToast={showToast} 
          />
        );
      case 'rent':
        return (
          <RentView 
            selectedPropertyId={selectedPropertyId} 
            properties={properties} 
            showToast={showToast} 
          />
        );
      case 'staff':
        return <StaffView showToast={showToast} />;
      case 'visitors':
        return <VisitorsView showToast={showToast} />;
      case 'complaints':
        return <ComplaintsView showToast={showToast} />;
      case 'maintenance':
        return (
          <MaintenanceView 
            selectedPropertyId={selectedPropertyId} 
            properties={properties} 
            showToast={showToast} 
          />
        );
      case 'notices':
        return <NoticesView showToast={showToast} />;
      case 'reports':
        return <ReportsView showToast={showToast} />;
      case 'settings':
        return <SettingsView showToast={showToast} />;
      default:
        return (
          <DashboardView 
            selectedPropertyId={selectedPropertyId} 
            properties={properties}
            setView={setView}
            showToast={showToast} 
          />
        );
    }
  };

  const getHeaderTitle = () => {
    const map: Record<string, string> = {
      dashboard: "Manager Overview",
      properties: "Properties Directory",
      rooms: "Room & Bed Roster",
      tenants: "Resident Directory",
      rent: "Rent Ledger",
      staff: "Employee Directory",
      visitors: "Visitor Logbook",
      complaints: "Service Tickets",
      maintenance: "Maintenance Work Orders",
      notices: "Society Announcements",
      reports: "Data Reports & Export",
      settings: "System Configuration"
    };
    return map[currentView] || "PG Master System";
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-gray-500">Loading PG Master workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans antialiased text-gray-800">
      
      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      <AnimatePresence mode="wait">
        {!currentUser ? (
          /* Login View screen */
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4"
          >
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-8 md:p-10 space-y-8">
              
              {/* Brand Header */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-blue-500/10">
                  P
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">PG Master Portal</h2>
                  <p className="text-xs text-gray-400 mt-1">Enterprise Paying Guest Management Suite</p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Authorized Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 transition-all"
                    placeholder="admin@pgms.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Password</label>
                    <button 
                      type="button" 
                      onClick={() => showToast("Please contact the main office administrator to recover credentials.", "info")} 
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-500 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Remember my workstation
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-lg hover:scale-[1.01]"
                >
                  Authenticate & Sign In
                </button>
              </form>

              {/* Demo accounts Helper Info banner */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 text-center">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Available Demo Credentials</span>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Email: <strong className="text-gray-700 font-bold">admin@pgms.com</strong> &bull; Password: <strong className="text-gray-700 font-bold">admin123</strong>
                </p>
              </div>

            </div>
          </motion.div>
        ) : (
          /* Main Workspace Screen layout */
          <motion.div 
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex w-full min-h-screen"
          >
            {/* Sidebar Navigation */}
            <Sidebar 
              currentView={currentView} 
              setView={setView} 
              userRole={currentUser.role} 
              onLogout={handleLogout} 
            />

            {/* Content area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              
              {/* Header */}
              <Header 
                properties={properties} 
                selectedPropertyId={selectedPropertyId} 
                setSelectedPropertyId={setSelectedPropertyId} 
                title={getHeaderTitle()} 
              />

              {/* Page view container with dynamic rendering */}
              <main className="flex-1 overflow-y-auto bg-gray-50/50 flex flex-col">
                {renderView()}
              </main>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
