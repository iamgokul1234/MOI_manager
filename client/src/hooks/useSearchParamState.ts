import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Read/write a single query-string param as component state (keeps back-navigation intact). */
export function useSearchParamState(
  key: string,
  defaultValue = ''
): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev);
          if (!next || next === defaultValue) copy.delete(key);
          else copy.set(key, next);
          return copy;
        },
        { replace: true }
      );
    },
    [key, defaultValue, setParams]
  );

  return [value, setValue];
}
