import { useRef, useMemo } from "react";

type noop = (...args: any[]) => any;

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  return useMemo(() => {
    return function(this: unknown, ...args: any[]) {
      return fnRef.current!.apply(this, args);
    } as T;
  }, []);
}