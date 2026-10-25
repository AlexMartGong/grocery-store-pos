import { useCallback, useEffect, useState } from "react";

type Settled<T> = {
  fetcher: () => Promise<T>;
  nonce: number;
  data?: T;
  failed: boolean;
  error?: unknown;
};

type Reported = {
  fetcher: unknown;
  nonce: number;
  message: string;
};

/**
 * Runs `fetcher` whenever its identity changes (or `reload()` is called) and tracks the result.
 * `fetcher` MUST be memoized (`useCallback` / `useMemo`) — a new function each render refetches forever.
 * Pass `null` to skip. `loading` is derived (no synchronous setState in the effect) and a response
 * from a superseded fetcher is dropped, so a slow old search can never overwrite a newer one.
 * `data` keeps the last settled value while the next request is in flight. `mapError` runs on read,
 * not in the effect, so an inline mapper can't trigger a refetch loop.
 *
 * `reportError(message)` surfaces an action's failure (delete, open detail…) through the same
 * `error`; like a load error it is dropped as soon as the next fetch starts. `null` clears it.
 */
export function useAsyncData<T>(
  fetcher: (() => Promise<T>) | null,
  mapError: (err: unknown) => string,
) {
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [reported, setReported] = useState<Reported | null>(null);

  useEffect(() => {
    if (!fetcher) return;
    let cancelled = false;
    fetcher().then(
      (data) => {
        if (!cancelled) setSettled({ fetcher, nonce, data, failed: false });
      },
      (err: unknown) => {
        if (!cancelled) {
          setSettled((prev) => ({ fetcher, nonce, data: prev?.data, failed: true, error: err }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fetcher, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const reportError = useCallback(
    (message: string | null) =>
      setReported(message === null ? null : { fetcher, nonce, message }),
    [fetcher, nonce],
  );

  const isCurrent = settled !== null && settled.fetcher === fetcher && settled.nonce === nonce;
  const reportedError =
    reported !== null && reported.fetcher === fetcher && reported.nonce === nonce
      ? reported.message
      : null;

  return {
    data: settled?.data,
    loading: fetcher !== null && !isCurrent,
    error: reportedError ?? (isCurrent && settled.failed ? mapError(settled.error) : null),
    reload,
    reportError,
  };
}
