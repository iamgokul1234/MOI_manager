import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

export const Card: React.FC<CardProps> = ({
  className,
  children,
  padding = 'md',
  hover = false,
  ...props
}) => (
  <div
    className={cn(
      'bg-white rounded-xl border border-gray-200 shadow-card',
      hover && 'hover:shadow-card-hover transition-shadow duration-150 cursor-pointer',
      paddings[padding],
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className }) => (
  <div
    className={cn(
      'flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100',
      className
    )}
  >
    <div className="min-w-0">
      <h2 className="font-semibold text-gray-900 text-base truncate">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  hint?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBg = 'bg-primary-50',
  hint,
  className,
}) => (
  <Card className={cn('flex items-start gap-4', className)}>
    {icon && (
      <div className={cn('p-3 rounded-xl shrink-0', iconBg)} aria-hidden>
        {icon}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  </Card>
);
