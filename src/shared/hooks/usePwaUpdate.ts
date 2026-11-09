import { useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// How often an open tab / installed PWA asks the server for a new sw.js.
const UPDATE_CHECK_INTERVAL_MS = 15 * 60_000;

// useRegisterSW reads its options once per mount and PwaUpdatePrompt mounts once (App.tsx), but a
// second registration callback must never stack another interval + listeners.
let checksStarted = false;
let swRegistration: ServiceWorkerRegistration | undefined;

function checkForUpdate(registration: ServiceWorkerRegistration | undefined) {
  if (!registration || registration.installing || navigator.onLine === false) return;
  // A network drop mid-check must not end up as an unhandled rejection.
  void registration.update().catch(() => undefined);
}

/**
 * Covers the cases where the plugin's `controlling` → reload never comes:
 * - No worker waiting: the new one is already active (another tab activated it, or the old one lost
 *   its last client). SKIP_WAITING would be a no-op, so reload now, whether or not this page is
 *   controlled; otherwise the button loops "Actualizando…" → re-enabled → nothing.
 * - A worker waiting on a hard-reloaded page (Shift+F5): the page is not controlled by any service
 *   worker and, without `clientsClaim`, activating the waiting one never fires `controlling` there. It
 *   already runs the new bundle (fetched from the network); reload once the worker is active so the
 *   banner goes away and the page comes under the new SW.
 */
function reloadIfUncontrolled(registration: ServiceWorkerRegistration | undefined) {
  const waiting = registration?.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }
  if (navigator.serviceWorker.controller) return; // controlled: the plugin reloads on `controlling`
  waiting.addEventListener("statechange", () => {
    if (waiting.state === "activated") window.location.reload();
  });
}

function startUpdateChecks(registration: ServiceWorkerRegistration | undefined) {
  if (!registration || checksStarted) return;
  checksStarted = true;
  swRegistration = registration;

  setInterval(() => checkForUpdate(registration), UPDATE_CHECK_INTERVAL_MS);

  // Foreground / reconnect: timers freeze while a PWA is backgrounded or a PC sleeps (same reason
  // as sessionKeeper).
  const onWake = () => {
    if (document.visibilityState === "visible") checkForUpdate(registration);
  };
  document.addEventListener("visibilitychange", onWake);
  window.addEventListener("online", onWake);
}

/**
 * Prompt-mode service worker updates: the new SW installs and waits; `needRefresh` turns true and the
 * user decides when to apply it with `updateApp` (SKIP_WAITING → the page reloads once the new SW takes
 * control). Never reload automatically: the POS cart lives only in memory.
 */
export const usePwaUpdate = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_swUrl, registration) => startUpdateChecks(registration),
  });

  const updateApp = useCallback(() => {
    reloadIfUncontrolled(swRegistration);
    void updateServiceWorker(true);
  }, [updateServiceWorker]);

  return { needRefresh, updateApp };
};
