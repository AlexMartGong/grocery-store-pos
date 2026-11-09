import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { usePwaUpdate } from "../../hooks/usePwaUpdate";

// Re-enable the button if the new service worker never takes control (the reload never comes).
const UPDATE_RETRY_MS = 8000;

/**
 * Persistent "new version" banner. Mounted once in App.tsx, outside the router, so it shows on
 * /login, /admin/* and /pos/*. No close button: it stays until the user updates.
 *
 * Position: on phones, below the h-16 header; from md up, centered inside the header band, whose
 * center is empty (`md:justify-end`). z-60 keeps it above every modal and drawer (all ≤ z-50,
 * including the blocking OpenShiftModal); sonner's Toaster (z-index 999999999) still renders above it.
 */
export const PwaUpdatePrompt = () => {
  const { needRefresh, updateApp } = usePwaUpdate();
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Entrance only: updating reloads the page, so there is no exit animation.
  useEffect(() => {
    if (!needRefresh) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShow(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [needRefresh]);

  const handleUpdate = () => {
    setUpdating(true);
    updateApp();
    setTimeout(() => setUpdating(false), UPDATE_RETRY_MS);
  };

  return (
    // The live region stays mounted so screen readers announce the banner when it appears.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-60 flex justify-center px-4 md:top-1.5"
    >
      {needRefresh && (
        <div
          className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-slate-900/95 py-1.5 pl-2 pr-1.5 text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/10 backdrop-blur transition-all duration-300 ease-out motion-reduce:transition-none md:w-auto md:max-w-none ${
            show ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <RefreshCw aria-hidden className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">
            Hay una nueva versión disponible
          </span>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating}
            className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-70"
          >
            {updating ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      )}
    </div>
  );
};
