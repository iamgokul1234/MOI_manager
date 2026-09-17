import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/people': 'People',
  '/functions': 'Functions',
  '/transactions': 'Transactions',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const title =
    Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    'Moi Management';

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
      <button
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-base font-bold text-gray-900">{title}</h1>
    </header>
  );
};
