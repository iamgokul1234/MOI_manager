import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeftRight, BarChart3, CalendarDays, LayoutDashboard, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddMoi: () => void;
}

const left = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/functions', icon: CalendarDays, label: 'Functions' },
];
const right = [
  { to: '/people', icon: Users, label: 'People' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Entries' },
];

const Item: React.FC<{ to: string; icon: React.ElementType; label: string }> = ({
  to,
  icon: Icon,
  label,
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium transition-colors min-w-0',
        isActive ? 'text-primary-600' : 'text-gray-500'
      )
    }
  >
    <Icon className="h-5 w-5" />
    <span className="truncate">{label}</span>
  </NavLink>
);

/** Phone tab bar with a raised, sticky "+ Add Moi" action in the middle. Reports lives under the header menu. */
export const BottomNav: React.FC<BottomNavProps> = ({ onAddMoi }) => (
  <nav
    className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_-8px_rgb(0_0_0_/0.15)] safe-area-pb"
    aria-label="Main"
  >
    <div className="flex items-stretch justify-around h-16 px-1">
      {left.map((i) => (
        <Item key={i.to} {...i} />
      ))}

      <div className="flex flex-col items-center justify-end flex-1 pb-1">
        <button
          id="mobile-add-moi-btn"
          type="button"
          onClick={onAddMoi}
          className="w-14 h-14 -mt-7 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-gray-50 hover:bg-primary-700 active:scale-95 transition-all focus:outline-none focus-visible:ring-primary-300"
          aria-label="Add Moi"
        >
          <Plus className="h-7 w-7" />
        </button>
        <span className="text-[11px] font-medium text-primary-700 mt-0.5">Add Moi</span>
      </div>

      {right.map((i) => (
        <Item key={i.to} {...i} />
      ))}
    </div>
  </nav>
);

export const REPORTS_ICON = BarChart3;
