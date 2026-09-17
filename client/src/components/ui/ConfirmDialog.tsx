import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

/** Plain-language confirmation for destructive or surprising actions. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={loading ? () => undefined : onClose} size="sm">
    <div className="p-6">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
          variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'
        }`}
        aria-hidden
      >
        {variant === 'danger' ? (
          <Trash2 className="h-6 w-6 text-red-500" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</h3>
      <div className="text-sm text-gray-600 text-center mb-6 whitespace-pre-line">{message}</div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          className="flex-1"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);
