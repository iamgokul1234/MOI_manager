import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItemData {
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

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const config: Record<ToastType, { icon: React.ElementType; border: string; iconColor: string }> = {
  success: { icon: CheckCircle2, border: 'border-received-500', iconColor: 'text-received-500' },
  error: { icon: XCircle, border: 'border-red-500', iconColor: 'text-red-500' },
  info: { icon: Info, border: 'border-primary-500', iconColor: 'text-primary-500' },
  warning: { icon: AlertTriangle, border: 'border-amber-500', iconColor: 'text-amber-500' },
};

const ToastItem: React.FC<{ toast: ToastItemData; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const { icon: Icon, border, iconColor } = config[toast.type];
  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl shadow-lg w-full bg-white border border-gray-200 border-l-4 animate-slide-up pointer-events-auto',
        border
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColor)} aria-hidden />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold text-gray-900">{toast.title}</p>}
        <p className="text-sm text-gray-700">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-700 shrink-0 p-1 -m-1 rounded-md"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItemData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-3), { id, type, message, title }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
    },
    [dismiss]
  );

  const ctx = useMemo<ToastContextValue>(
    () => ({
      toast: addToast,
      success: (m, t) => addToast('success', m, t),
      error: (m, t) => addToast('error', m, t),
      info: (m, t) => addToast('info', m, t),
      warning: (m, t) => addToast('warning', m, t),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        className="fixed bottom-24 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:w-96 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
