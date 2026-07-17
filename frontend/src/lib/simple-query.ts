'use client';

import * as React from 'react';

type QueryKey = readonly unknown[];

type Listener = () => void;

type RegistryEntry = {
  key: QueryKey;
  listeners: Set<Listener>;
};

const registry = new Map<string, RegistryEntry>();

export const keepPreviousData: unique symbol = Symbol('keepPreviousData');

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const walk = (v: any): any => {
    if (v === null || typeof v !== 'object') return v;
    if (v instanceof Date) return { $date: v.toISOString() };
    if (Array.isArray(v)) return v.map(walk);
    if (v instanceof Map) return { $map: Array.from(v.entries()).map(([k, val]) => [walk(k), walk(val)]) };
    if (v instanceof Set) return { $set: Array.from(v.values()).map(walk) };
    if (typeof v === 'object') {
      if (seen.has(v)) return '[Circular]';
      seen.add(v);
      const out: Record<string, any> = {};
      for (const k of Object.keys(v).sort()) out[k] = walk(v[k]);
      return out;
    }
    return String(v);
  };
  return JSON.stringify(walk(value));
}

function keyId(key: QueryKey): string {
  return stableStringify(key);
}

function isPrefix(prefix: QueryKey, full: QueryKey): boolean {
  if (prefix.length > full.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (stableStringify(prefix[i]) !== stableStringify(full[i])) return false;
  }
  return true;
}

function subscribe(key: QueryKey, listener: Listener): () => void {
  const id = keyId(key);
  const entry = registry.get(id) ?? { key, listeners: new Set<Listener>() };
  entry.listeners.add(listener);
  registry.set(id, entry);
  return () => {
    const e = registry.get(id);
    if (!e) return;
    e.listeners.delete(listener);
    if (e.listeners.size === 0) registry.delete(id);
  };
}

function notify(prefixKey: QueryKey) {
  for (const entry of registry.values()) {
    if (isPrefix(prefixKey, entry.key)) {
      for (const l of entry.listeners) l();
    }
  }
}

export function useQueryClient() {
  return React.useMemo(
    () => ({
      invalidateQueries: ({ queryKey }: { queryKey: QueryKey }) => notify(queryKey),
    }),
    [],
  );
}

export function useQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  placeholderData,
  staleTime,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  placeholderData?: typeof keepPreviousData;
  staleTime?: number;
}): { data: T | undefined; isLoading: boolean; isFetching: boolean; error: unknown; refetch: () => void } {
  const keyHash = React.useMemo(() => keyId(queryKey), [queryKey]);
  const dataRef = React.useRef<T | undefined>(undefined);
  const fetchedAtRef = React.useRef<number>(0);

  const [data, setData] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState<unknown>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  React.useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const run = React.useCallback((force = false) => {
    if (!enabled) return;
    if (!force && staleTime && dataRef.current !== undefined) {
      const age = Date.now() - fetchedAtRef.current;
      if (age >= 0 && age < staleTime) return;
    }
    let alive = true;
    setIsFetching(true);
    setError(null);
    queryFn()
      .then((d) => {
        if (!alive) return;
        setData(d);
        fetchedAtRef.current = Date.now();
        setHasLoadedOnce(true);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e);
        setHasLoadedOnce(true);
      })
      .finally(() => {
        if (!alive) return;
        setIsFetching(false);
      });
    return () => {
      alive = false;
    };
  }, [enabled, queryFn, staleTime]);

  // Refetch on key/enabled changes.
  React.useEffect(() => {
    if (!enabled) return;
    if (placeholderData !== keepPreviousData) setData(undefined);
    const cleanup = run();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, keyHash]);

  // Allow external invalidation.
  React.useEffect(() => subscribe(queryKey, () => run(true)), [keyHash, run, queryKey]);

  return {
    data,
    error,
    isFetching,
    isLoading: !hasLoadedOnce && isFetching,
    refetch: () => run(true),
  };
}

export function useMutation<TData>(opts: {
  mutationFn: () => Promise<TData>;
  onSuccess?: (data: TData) => unknown;
  onError?: (err: unknown) => void;
}): {
  mutate: () => void;
  mutateAsync: () => Promise<TData>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
};
export function useMutation<TData, TVars>(opts: {
  mutationFn: (vars: TVars) => Promise<TData>;
  onSuccess?: (data: TData, vars: TVars) => unknown;
  onError?: (err: unknown, vars: TVars) => void;
}): {
  mutate: (vars: TVars) => void;
  mutateAsync: (vars: TVars) => Promise<TData>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
};
export function useMutation<TData, TVars>(opts: {
  mutationFn: ((vars: TVars) => Promise<TData>) | (() => Promise<TData>);
  onSuccess?: ((data: TData, vars: TVars) => unknown) | ((data: TData) => unknown);
  onError?: ((err: unknown, vars: TVars) => void) | ((err: unknown) => void);
}) {
  const { mutationFn, onSuccess, onError } = opts;
  const [isPending, setIsPending] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const reset = React.useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, []);

  const mutateAsync = React.useCallback(
    async (vars?: TVars) => {
      setIsPending(true);
      setIsSuccess(false);
      setIsError(false);
      setError(null);
      try {
        const data = await (mutationFn as any)(vars);
        await (onSuccess as any)?.(data, vars);
        setIsSuccess(true);
        return data;
      } catch (e) {
        setIsError(true);
        setError(e);
        (onError as any)?.(e, vars);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [mutationFn, onError, onSuccess],
  );

  const mutate = React.useCallback(
    (vars?: TVars) => {
      void mutateAsync(vars as any);
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending, isSuccess, isError, error, reset };
}

