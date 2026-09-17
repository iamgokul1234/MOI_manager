import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, Gift, Home, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFunctionType } from '@/lib/utils';
import type { FunctionCategory, TransactionType } from '@/types';

type Variant = 'default' | 'received' | 'given' | 'primary' | 'warning' | 'success' | 'error' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  muted: 'bg-gray-50 text-gray-500 border border-gray-200',
  received: 'bg-received-50 text-received-700 border border-received-100',
  given: 'bg-given-50 text-given-700 border border-given-100',
  primary: 'bg-primary-50 text-primary-700 border border-primary-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  error: 'bg-red-50 text-red-700 border border-red-100',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
  title,
}) => (
  <span
    title={title}
    className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
      variants[variant],
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      className
    )}
  >
    {children}
  </span>
);

/** Received / Given — colour plus icon plus label, never colour alone. */
export const TransactionBadge: React.FC<{
  type: TransactionType;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ type, showIcon = true, size = 'sm', className }) => {
  const isReceived = type === 'RECEIVED';
  return (
    <Badge variant={isReceived ? 'received' : 'given'} size={size} className={className}>
      {showIcon &&
        (isReceived ? (
          <ArrowDownLeft className="h-3 w-3" aria-hidden />
        ) : (
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        ))}
      {isReceived ? 'Received' : 'Given'}
    </Badge>
  );
};

const typeColors: Record<string, string> = {
  Wedding: 'bg-pink-50 text-pink-700 border-pink-100',
  Housewarming: 'bg-orange-50 text-orange-700 border-orange-100',
  Birthday: 'bg-purple-50 text-purple-700 border-purple-100',
  EarPiercing: 'bg-teal-50 text-teal-700 border-teal-100',
  Engagement: 'bg-rose-50 text-rose-700 border-rose-100',
  BabyShower: 'bg-sky-50 text-sky-700 border-sky-100',
  Funeral: 'bg-gray-100 text-gray-600 border-gray-200',
  Other: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

export const FunctionTypeBadge: React.FC<{ type: string; className?: string }> = ({
  type,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full px-2 py-0.5 text-xs border whitespace-nowrap',
      typeColors[type] || 'bg-indigo-50 text-indigo-700 border-indigo-100',
      className
    )}
  >
    <Gift className="h-3 w-3" aria-hidden />
    {formatFunctionType(type)}
  </span>
);

/** Our Function vs Relative Function. */
export const CategoryBadge: React.FC<{ category: FunctionCategory; className?: string }> = ({
  category,
  className,
}) => {
  const isOur = category === 'OUR';
  return (
    <Badge variant={isOur ? 'primary' : 'muted'} className={className}>
      {isOur ? <Home className="h-3 w-3" aria-hidden /> : <Users className="h-3 w-3" aria-hidden />}
      {isOur ? 'Our Function' : 'Relative Function'}
    </Badge>
  );
};

export const AttendedBadge: React.FC<{ attended: boolean; className?: string }> = ({
  attended,
  className,
}) => (
  <Badge variant={attended ? 'success' : 'muted'} className={className}>
    {attended ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
    {attended ? 'Attended' : 'Not attended'}
  </Badge>
);
