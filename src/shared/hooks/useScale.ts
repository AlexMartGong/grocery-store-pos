import { useCallback, useEffect, useRef, useState } from "react";
import { readScale, type ScaleReadingDTO } from "../api/agentApi";

const INITIAL: ScaleReadingDTO = { weight: 0, isStable: false, error: null };

const POLL_INTERVAL_MS = 300;

/**
 * Polls the local agent's physical scale endpoint while `enabled` is true.
 * Returns the latest reading and an in-flight flag. Polling stops (and the
 * reading resets) as soon as `enabled` turns false.
 */
export const useScale = (enabled: boolean) => {
  const [reading, setReading] = useState<ScaleReadingDTO>(INITIAL);
  const [isReading, setIsReading] = useState(false);
  const inFlightRef = useRef(false);

  const tick = useCallback(async () => {
    if (inFlightRef.current) return; // skip overlapping requests
    inFlightRef.current = true;
    setIsReading(true);
    try {
      const result = await readScale();
      setReading(result);
    } finally {
      inFlightRef.current = false;
      setIsReading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      const raf = requestAnimationFrame(() => setReading(INITIAL));
      return () => cancelAnimationFrame(raf);
    }
    void tick(); // immediate first read
    const id = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, tick]);

  return { reading, isReading };
};
