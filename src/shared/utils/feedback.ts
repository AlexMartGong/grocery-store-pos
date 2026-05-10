let audioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext | null => {
  if (audioCtx) return audioCtx;
  const Ctor =
    typeof window !== "undefined"
      ? window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
};

export const playBeep = (durationMs = 90, freq = 1200): void => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  } catch {
    /* audio is best-effort */
  }
};

export const playErrorBeep = (): void => {
  playBeep(140, 220);
};

export const vibrate = (pattern: number | number[] = 50): void => {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate === "function") nav.vibrate(pattern);
};
