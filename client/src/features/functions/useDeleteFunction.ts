import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { functionsApi } from '@/api/functions';
import { useToast } from '@/components/ui/Toast';
import { invalidateMoiData } from '@/lib/queryClient';
import { getErrorMessage } from '@/lib/utils';
import type { FunctionEvent } from '@/types';

/**
 * Two-step delete: first attempt without confirm; if the API answers 409
 * (entries exist) we surface a stronger warning and retry with confirm=true.
 */
export function useDeleteFunction(onDeleted?: (fn: FunctionEvent) => void) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [target, setTarget] = useState<FunctionEvent | null>(null);
  const [entryCount, setEntryCount] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: boolean }) =>
      functionsApi.delete(id, confirm),
    onSuccess: (res, _vars) => {
      success(res.message || 'Function deleted');
      const deleted = target;
      setTarget(null);
      setEntryCount(null);
      invalidateMoiData(qc);
      if (deleted) onDeleted?.(deleted);
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const data = err.response.data as { data?: { transactionCount?: number } };
        setEntryCount(data.data?.transactionCount ?? 1);
        return;
      }
      error(getErrorMessage(err, 'Could not delete the function'));
    },
  });

  const request = (fn: FunctionEvent) => {
    setTarget(fn);
    setEntryCount(null);
  };

  const cancel = () => {
    setTarget(null);
    setEntryCount(null);
  };

  const confirm = () => {
    if (!target) return;
    mutation.mutate({ id: target._id, confirm: entryCount !== null });
  };

  return {
    target,
    entryCount,
    isPending: mutation.isPending,
    request,
    cancel,
    confirm,
  };
}
