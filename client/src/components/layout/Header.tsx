import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

const pageTitles: [string, string][] = [
  ['/dashboard', 'Dashboard'],
  ['/people', 'People'],
  ['/functions', 'Functions'],
  ['/transactions', 'Transactions'],
  ['/reports', 'Reports'],
  ['/settings', 'Settings'],
];

/** Mobile-only top bar: logo, current section, and an account menu (Reports, Settings, Sign out). */
export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = pageTitles.find(([path]) => location.pathname.startsWith(path))?.[1] || 'Moi';

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 h-14 flex items-center px-4 gap-3">
      <Logo compact />
      <h1 className="text-base font-bold text-gray-900 flex-1 truncate">{title}</h1>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Avatar initial={user?.name?.charAt(0).toUpperCase() || '?'} size="sm" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-11 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <NavLink
              to="/reports"
              role="menuitem"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-sm',
                  isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'
                )
              }
            >
              <BarChart3 className="h-4 w-4" /> Reports
            </NavLink>
            <Link
              to="/settings"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
