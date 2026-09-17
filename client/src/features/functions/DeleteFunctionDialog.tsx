import React from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { useDeleteFunction } from './useDeleteFunction';

type DeleteState = ReturnType<typeof useDeleteFunction>;

/** Renders the right confirmation copy for the two-step function delete. */
export const DeleteFunctionDialog: React.FC<{ state: DeleteState }> = ({ state }) => {
  const { target, entryCount, isPending, cancel, confirm } = state;
  if (!target) return null;

  if (entryCount !== null) {
    return (
      <ConfirmDialog
        isOpen
        onClose={cancel}
        onConfirm={confirm}
        title="This function has Moi entries"
        message={`"${target.name}" has ${entryCount} Moi ${
          entryCount === 1 ? 'entry' : 'entries'
        }. Deleting the function will delete those entries too, and your totals will change.\n\nDo you still want to delete it?`}
        confirmLabel="Delete everything"
        variant="danger"
        loading={isPending}
      />
    );
  }

  return (
    <ConfirmDialog
      isOpen
      onClose={cancel}
      onConfirm={confirm}
      title="Delete this function?"
      message={`"${target.name}" will be removed. This cannot be undone.`}
      confirmLabel="Delete"
      loading={isPending}
    />
  );
};
