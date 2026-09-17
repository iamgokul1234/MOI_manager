import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { peopleApi } from '@/api/people';
import { useToast } from '@/components/ui/Toast';
import { invalidateMoiData, qk } from '@/lib/queryClient';
import { getErrorMessage } from '@/lib/utils';
import type { Person } from '@/types';

/** Two-step soft delete: 409 from the API means "has entries, confirm first". */
export function useDeletePerson(onDeleted?: (person: Person) => void) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [target, setTarget] = useState<Person | null>(null);
  const [entryCount, setEntryCount] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: boolean }) => peopleApi.delete(id, confirm),
    onSuccess: (res) => {
      success(res.message || 'Person removed');
      const deleted = target;
      setTarget(null);
      setEntryCount(null);
      invalidateMoiData(qc);
      qc.invalidateQueries({ queryKey: qk.areas });
      if (deleted) onDeleted?.(deleted);
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const data = err.response.data as { data?: { transactionCount?: number } };
        setEntryCount(data.data?.transactionCount ?? 1);
        return;
      }
      error(getErrorMessage(err, 'Could not remove the person'));
    },
  });

  return {
    target,
    entryCount,
    isPending: mutation.isPending,
    request: (p: Person) => {
      setTarget(p);
      setEntryCount(null);
    },
    cancel: () => {
      setTarget(null);
      setEntryCount(null);
    },
    confirm: () => {
      if (target) mutation.mutate({ id: target._id, confirm: entryCount !== null });
    },
  };
}
