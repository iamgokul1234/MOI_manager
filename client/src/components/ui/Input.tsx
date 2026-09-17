import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Text shown inside the field on the left (e.g. ₹). */
  prefix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, prefix, id, required, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
          </label>
        )}
        <div className="relative">
          {(leftIcon || prefix) && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-medium">
              {leftIcon || prefix}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            required={required}
            className={cn(
              'block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 min-h-[44px] text-base sm:text-sm text-gray-900 placeholder-gray-400 shadow-sm',
              'transition-colors duration-150',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
              (leftIcon || prefix) && 'pl-10',
              rightIcon && 'pr-10',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
