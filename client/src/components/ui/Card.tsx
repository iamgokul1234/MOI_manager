import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  padding = 'md',
  hover = false,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-card',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBg = 'bg-primary-50',
  className,
}) => {
  return (
    <Card className={cn('flex items-start gap-4', className)}>
      {icon && (
        <div className={cn('p-3 rounded-xl shrink-0', iconBg)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
      </div>
    </Card>
  );
};
