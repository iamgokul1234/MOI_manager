import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ArrowLeftRight,
  BarChart3,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddMoi: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/functions', icon: Calendar, label: 'Functions' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ onAddMoi }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors',
                isActive ? 'text-primary-600' : 'text-gray-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Central Add Moi FAB */}
        <div className="flex flex-col items-center justify-center flex-1">
          <button
            id="mobile-add-moi-btn"
            onClick={onAddMoi}
            className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 active:scale-95 transition-all -mt-4"
            aria-label="Add Moi"
          >
            <Plus className="h-6 w-6" />
          </button>
          <span className="text-xs text-gray-500 mt-0.5">Add Moi</span>
        </div>

        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors',
                isActive ? 'text-primary-600' : 'text-gray-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
