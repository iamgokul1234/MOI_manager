import React from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getPersonName } from '@/lib/utils';
import type { useDeletePerson } from './useDeletePerson';

type DeleteState = ReturnType<typeof useDeletePerson>;

export const DeletePersonDialog: React.FC<{ state: DeleteState }> = ({ state }) => {
  const { target, entryCount, isPending, cancel, confirm } = state;
  if (!target) return null;
  const name = getPersonName(target);

  if (entryCount !== null) {
    return (
      <ConfirmDialog
        isOpen
        onClose={cancel}
        onConfirm={confirm}
        title="This person has Moi history"
        message={`${name} has ${entryCount} Moi ${
          entryCount === 1 ? 'entry' : 'entries'
        }. They will be hidden from your lists and their entries will no longer count in totals.\n\nRemove them anyway?`}
        confirmLabel="Remove anyway"
        variant="warning"
        loading={isPending}
      />
    );
  }

  return (
    <ConfirmDialog
      isOpen
      onClose={cancel}
      onConfirm={confirm}
      title={`Remove ${name}?`}
      message="They will be hidden from your People list and searches."
      confirmLabel="Remove"
      loading={isPending}
    />
  );
};
