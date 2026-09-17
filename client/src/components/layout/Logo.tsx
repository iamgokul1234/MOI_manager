import React from 'react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Logo: React.FC<{ className?: string; compact?: boolean }> = ({ className, compact }) => (
  <Link to="/dashboard" className={cn('flex items-center gap-3', className)} aria-label="Moi Management home">
    <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
      <Coins className="h-5 w-5 text-white" aria-hidden />
    </div>
    {!compact && (
      <div className="leading-tight">
        <p className="text-base font-bold text-gray-900">Moi</p>
        <p className="text-xs text-gray-500">Management</p>
      </div>
    )}
  </Link>
);
