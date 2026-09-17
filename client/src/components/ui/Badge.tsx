import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Gift } from 'lucide-react';
import type { TransactionType } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'received' | 'given' | 'primary' | 'warning' | 'success' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    received: 'bg-received-50 text-received-700',
    given: 'bg-given-50 text-given-700',
    primary: 'bg-primary-50 text-primary-700',
    warning: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    error: 'bg-red-50 text-red-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const TransactionBadge: React.FC<{ type: TransactionType; amount?: number; showIcon?: boolean }> = ({
  type,
  amount,
  showIcon = true,
}) => {
  const isReceived = type === 'RECEIVED';
  return (
    <Badge variant={isReceived ? 'received' : 'given'}>
      {showIcon && (isReceived ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      {isReceived ? 'Received' : 'Given'}
    </Badge>
  );
};

export const FunctionTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const typeColors: Record<string, string> = {
    Wedding: 'bg-pink-50 text-pink-700',
    Housewarming: 'bg-orange-50 text-orange-700',
    Birthday: 'bg-purple-50 text-purple-700',
    EarPiercing: 'bg-teal-50 text-teal-700',
    Engagement: 'bg-rose-50 text-rose-700',
    BabyShower: 'bg-blue-50 text-blue-700',
    Funeral: 'bg-gray-100 text-gray-600',
    Other: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full px-2 py-0.5 text-xs',
        typeColors[type] || 'bg-gray-100 text-gray-700'
      )}
    >
      <Gift className="h-3 w-3" />
      {type}
    </span>
  );
};
