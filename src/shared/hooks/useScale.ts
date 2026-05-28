import { useEffect, useRef, useState } from "react";
import { readScale, type ScaleReadingDTO } from "../api/agentApi";

const INITIAL: ScaleReadingDTO = { weight: 0, isStable: false, error: null };

const POLL_INTERVAL_MS = 300;

/**
 * Polls the local agent's physical scale endpoint while `enabled` is true.
 * Returns the latest reading. Polling stops (and the reading resets) as soon as
 * `enabled` turns false.
 *
 * `setReading` only commits when the reading actually changes, so a steady
 * weight does not trigger ~6.7 re-renders/s on low-end hardware. An in-flight
 * request that resolves after the effect is torn down is discarded via the
 * `cancelled` flag, so we never write to an unmounted component.
 */
export const useScale = (enabled: boolean) => {
  const [reading, setReading] = useState<ScaleReadingDTO>(INITIAL);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      const raf = requestAnimationFrame(() => setReading(INITIAL));
      return () => cancelAnimationFrame(raf);
    }

    let cancelled = false;

    const tick = async () => {
      if (inFlightRef.current) return; // skip overlapping requests
      inFlightRef.current = true;
      try {
        const result = await readScale();
        if (cancelled) return; // discard stale read after teardown
        setReading((prev) =>
          prev.weight === result.weight &&
          prev.isStable === result.isStable &&
          prev.error === result.error
            ? prev
            : result,
        );
      } finally {
        inFlightRef.current = false;
      }
    };

    void tick(); // immediate first read
    const id = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);

  return { reading };
};
