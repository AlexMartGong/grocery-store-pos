import type { RefreshOutcome } from "../types";
import { decodeToken, isStoreRole, msUntilExpiry } from "../utils/token";
import { useAuthStore } from "./authStore";

// Renew the store access token this long before `exp`.
const REFRESH_LEAD_MS = 5 * 60_000;
// Floor for the proactive timer: with a token lifetime ≤ the lead, an unclamped delay of 0 would
// refresh in a tight loop until the backend's 30/min refresh rate limit answers 429.
const MIN_DELAY_MS = 30_000;
// Retry after a transient failure (offline, 5xx, 429).
const RETRY_DELAY_MS = 60_000;

let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;

/** ms until the current store token expires, or `null` when there is no store session. */
function storeTokenTtl(): number | null {
  const { token, user } = useAuthStore.getState();
  if (!token || !isStoreRole(user?.role)) return null;
  const decoded = decodeToken(token);
  return decoded ? msUntilExpiry(decoded) : null;
}

function schedule(delayMs: number) {
  clearTimeout(timer);
  timer = setTimeout(() => void refreshNow(), delayMs);
}

function handleOutcome(outcome: RefreshOutcome) {
  // "refreshed" reschedules through the token subscription; "rejected" already logged out.
  if (outcome === "unavailable" && storeTokenTtl() !== null) schedule(RETRY_DELAY_MS);
}

async function refreshNow() {
  if (storeTokenTtl() === null) return;
  handleOutcome(await useAuthStore.getState().refreshSession());
}

function reschedule() {
  clearTimeout(timer);
  const ttl = storeTokenTtl();
  if (ttl === null) return;
  schedule(Math.max(ttl - REFRESH_LEAD_MS, MIN_DELAY_MS));
}

/** Foreground / reconnect: timers freeze while a PWA is backgrounded or a PC sleeps. */
function onWake() {
  if (document.visibilityState !== "visible") return;
  if (useAuthStore.getState().isRestoring) return;
  const ttl = storeTokenTtl();
  if (ttl === null) return;
  if (ttl <= REFRESH_LEAD_MS) void refreshNow();
  else reschedule();
}

/**
 * Keeps store-user (OWNER/CASHIER) sessions alive: boot-time restore of an expired token,
 * proactive refresh ~5 min before `exp`, and a check on visibilitychange / online. SUPER_ADMIN
 * sessions have no refresh cookie and are ignored. Call once from main.tsx — after every module
 * has evaluated, so the store exists (onRehydrateStorage cannot start network calls itself).
 */
export function startSessionKeeper() {
  if (started) return;
  started = true;

  useAuthStore.subscribe((state, prev) => {
    if (state.token !== prev.token) reschedule();
  });
  document.addEventListener("visibilitychange", onWake);
  window.addEventListener("online", onWake);

  const { isRestoring, restoreSession } = useAuthStore.getState();
  if (isRestoring) void restoreSession().then(handleOutcome);
  else reschedule();
}
