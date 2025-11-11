import { useCallback, useRef } from 'preact/hooks';

type AnyFunction = (...args: any[]) => void;

export const useEvent = <T extends AnyFunction>(handler: T): T => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args: unknown[]) => handlerRef.current(...args)) as T, []);
};
