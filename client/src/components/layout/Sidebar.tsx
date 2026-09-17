import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Plus,
  Banknote,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/functions', icon: Calendar, label: 'Functions' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  onAddMoi: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddMoi }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 z-30 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
          <Banknote className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">Moi</h1>
          <p className="text-xs text-gray-500 -mt-0.5">Management</p>
        </div>
      </div>

      {/* Add Moi Button */}
      <div className="px-4 py-4">
        <button
          id="sidebar-add-moi-btn"
          onClick={onAddMoi}
          className="w-full flex items-center gap-2.5 bg-primary-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow"
        >
          <Plus className="h-4 w-4" />
          Add Moi
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors duration-150',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn('h-4.5 w-4.5', isActive ? 'text-primary-600' : 'text-gray-400')}
                  style={{ width: 18, height: 18 }}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
