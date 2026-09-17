import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from './Logo';

export interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

export const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/functions', icon: CalendarDays, label: 'Functions' },
  { to: '/people', icon: Users, label: 'People' },
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
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-30">
      <div className="px-6 py-5 border-b border-gray-100">
        <Logo />
      </div>

      <div className="px-4 pt-4 pb-2">
        <button
          id="sidebar-add-moi-btn"
          type="button"
          onClick={onAddMoi}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Moi
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto" aria-label="Main">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn('h-[18px] w-[18px]', isActive ? 'text-primary-600' : 'text-gray-400')}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar initial={user?.name?.charAt(0).toUpperCase() || '?'} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
};
