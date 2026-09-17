import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-white border-l-4 border-emerald-500',
      iconColor: 'text-emerald-500',
    },
    error: {
      icon: XCircle,
      bg: 'bg-white border-l-4 border-red-500',
      iconColor: 'text-red-500',
    },
    info: {
      icon: Info,
      bg: 'bg-white border-l-4 border-primary-500',
      iconColor: 'text-primary-500',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-white border-l-4 border-amber-500',
      iconColor: 'text-amber-500',
    },
  };

  const { icon: Icon, bg, iconColor } = config[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl shadow-lg max-w-sm w-full animate-slide-up',
        bg
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColor)} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        )}
        <p className="text-sm text-gray-600">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, type, message, title }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (m, t) => addToast('success', m, t),
    error: (m, t) => addToast('error', m, t),
    info: (m, t) => addToast('info', m, t),
    warning: (m, t) => addToast('warning', m, t),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
