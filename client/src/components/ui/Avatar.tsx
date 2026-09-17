import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  initial: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'primary' | 'gray';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-xl',
};

export const Avatar: React.FC<AvatarProps> = ({ initial, size = 'md', tone = 'primary', className }) => (
  <div
    aria-hidden
    className={cn(
      'rounded-full flex items-center justify-center shrink-0 font-bold',
      sizes[size],
      tone === 'primary' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600',
      className
    )}
  >
    {initial}
  </div>
);
