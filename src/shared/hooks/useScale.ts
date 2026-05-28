import { useEffect, useState } from "react";
import { readScale, type ScaleReadingDTO } from "../api/agentApi";

const INITIAL: ScaleReadingDTO = { weight: 0, isStable: false, error: null };

const POLL_INTERVAL_MS = 300;
const MAX_INTERVAL_MS = 3000;

/**
 * Polls the local agent's physical scale endpoint while `enabled` is true.
 * Returns the latest reading. Polling stops (and the reading resets) as soon as
 * `enabled` turns false.
 *
 * `setReading` only commits when the reading actually changes, so a steady
 * weight does not trigger ~6.7 re-renders/s on low-end hardware. An in-flight
 * request that resolves after the effect is torn down is discarded via the
 * `cancelled` flag, so we never write to an unmounted component.
 *
 * Self-scheduling `setTimeout` loop (not a fixed `setInterval`) so the cadence
 * can change: when the agent is unreachable we back off exponentially
 * (300 → 600 → 1200 → 2400 → 3000 ms, capped) instead of hammering the LAN at
 * 300 ms; a clean reading resets it to 300 ms. Chaining also guarantees a
 * single in-flight request. The request carries an `AbortSignal` that the
 * cleanup aborts, so an unmounted modal never leaves a socket pending.
 */
export const useScale = (enabled: boolean) => {
  const [reading, setReading] = useState<ScaleReadingDTO>(INITIAL);

  useEffect(() => {
    if (!enabled) {
      const raf = requestAnimationFrame(() => setReading(INITIAL));
      return () => cancelAnimationFrame(raf);
    }

    let cancelled = false;
    let consecutiveErrors = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const tick = async () => {
      try {
        const result = await readScale(controller.signal);
        if (cancelled) return; // discard stale read after teardown
        consecutiveErrors = result.error ? consecutiveErrors + 1 : 0;
        setReading((prev) =>
          prev.weight === result.weight &&
          prev.isStable === result.isStable &&
          prev.error === result.error
            ? prev
            : result,
        );
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(
            () => void tick(),
            Math.min(POLL_INTERVAL_MS * 2 ** consecutiveErrors, MAX_INTERVAL_MS),
          );
        }
      }
    };

    void tick(); // immediate first read

    return () => {
      cancelled = true;
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled]);

  return { reading };
};
