import {useCallback, useEffect, useRef} from 'react';

// Coalesces a burst of calls (e.g. every 'input' tick of a native color/range
// picker) into one call after `delayMs` of silence, so expensive downstream
// work (re-layouting a graph, persisting a draft, ...) doesn't run per-tick.
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return useCallback(
    (...args: Args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    },
    [delayMs],
  );
}
