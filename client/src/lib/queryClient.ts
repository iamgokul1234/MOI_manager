import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Query-key roots used across the app. Keep them in one place so invalidation is consistent. */
export const qk = {
  dashboard: ['dashboard'] as const,
  people: ['people'] as const,
  person: (id: string) => ['person', id] as const,
  areas: ['areas'] as const,
  functions: ['functions'] as const,
  fn: (id: string) => ['function', id] as const,
  functionPeople: (id: string) => ['function-people', id] as const,
  transactions: ['transactions'] as const,
  reports: ['reports'] as const,
};

/** After any Moi entry changes, every derived total is stale. */
export function invalidateMoiData(qc: QueryClient, ids: { personId?: string; functionId?: string } = {}): void {
  qc.invalidateQueries({ queryKey: qk.dashboard });
  qc.invalidateQueries({ queryKey: qk.people });
  qc.invalidateQueries({ queryKey: qk.functions });
  qc.invalidateQueries({ queryKey: qk.transactions });
  qc.invalidateQueries({ queryKey: qk.reports });
  qc.invalidateQueries({ queryKey: ['function-people'] });
  qc.invalidateQueries({ queryKey: ['person'] });
  qc.invalidateQueries({ queryKey: ['function'] });
  if (ids.personId) qc.invalidateQueries({ queryKey: qk.person(ids.personId) });
  if (ids.functionId) qc.invalidateQueries({ queryKey: qk.fn(ids.functionId) });
}
