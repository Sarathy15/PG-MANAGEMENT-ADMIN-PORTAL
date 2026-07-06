import { 
  LayoutDashboard, Building2, Bed, Users, CreditCard, UserCheck, Eye, HelpCircle, Wrench, Megaphone, FileText, Settings, LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  userRole: string;
  onLogout: () => void;
}

export default function Sidebar({ currentView, setView, userRole, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Property Admin', 'Manager', 'Staff'] },
    { id: 'properties', name: 'Properties', icon: Building2, roles: ['Super Admin', 'Property Admin', 'Manager'] },
    { id: 'rooms', name: 'Rooms', icon: Bed, roles: ['Super Admin', 'Property Admin', 'Manager', 'Staff'] },
    { id: 'tenants', name: 'Tenants', icon: Users, roles: ['Super Admin', 'Property Admin', 'Manager', 'Staff'] },
    { id: 'rent', name: 'Rent & Invoices', icon: CreditCard, roles: ['Super Admin', 'Property Admin', 'Manager'] },
    { id: 'staff', name: 'Staff Management', icon: UserCheck, roles: ['Super Admin', 'Property Admin'] },
    { id: 'visitors', name: 'Visitor Log', icon: Eye, roles: ['Super Admin', 'Property Admin', 'Manager', 'Staff'] },
    { id: 'complaints', name: 'Complaints', icon: HelpCircle, roles: ['Super Admin', 'Property Admin', 'Manager', 'Staff'] },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench, roles: ['Super Admin', 'Property Admin', 'Manager', 'Staff'] },
    { id: 'notices', name: 'Notices', icon: Megaphone, roles: ['Super Admin', 'Property Admin', 'Manager'] },
    { id: 'reports', name: 'Reports & Export', icon: FileText, roles: ['Super Admin', 'Property Admin', 'Manager'] },
    { id: 'settings', name: 'Settings', icon: Settings, roles: ['Super Admin', 'Property Admin'] },
  ];

  // Filter menu items by user role
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20">
          P
        </div>
        <div>
          <h1 className="font-bold text-gray-900 tracking-tight leading-none text-base">PG Master</h1>
          <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-1 inline-block">SaaS Enterprise</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer User Profile & Logout */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
            {userRole === 'Property Admin' ? 'PA' : 'ST'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {userRole === 'Property Admin' ? 'Property Admin' : 'Staff Member'}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {userRole === 'Property Admin' ? 'admin@pgms.com' : 'staff@pgms.com'}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
