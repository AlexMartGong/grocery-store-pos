import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCashShiftStore } from "../../cash/store/cashShiftStore";
import { useNotificationStore } from "../../notifications/store/notificationStore";
import { useStoreProfileStore } from "../../stores/store/storeProfileStore";
import { logoutStoreSession, refreshStoreSession } from "../api/authApi";
import type { AuthUser, RefreshOutcome } from "../types";
import { mapAuthError } from "../utils/errorMessages";
import { decodeToken, isExpired, isStoreRole, toAuthUser } from "../utils/token";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Boot-time refresh of an expired store session in flight. Not persisted. */
  isRestoring: boolean;
  setToken: (token: string, username: string) => boolean;
  refreshSession: () => Promise<RefreshOutcome>;
  restoreSession: () => Promise<RefreshOutcome>;
  logout: () => Promise<void>;
}

// Single-flight: every trigger (401 interceptor, boot, timer, visibility) shares one refresh, so the
// rotating refresh cookie is presented once per rotation.
let refreshPromise: Promise<RefreshOutcome> | null = null;
let logoutPromise: Promise<void> | null = null;
// Bumped by logout so a refresh still in flight cannot resurrect a session the user just closed.
let sessionEpoch = 0;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isRestoring: false,
      setToken: (token, username) => {
        const decoded = decodeToken(token);
        if (!decoded || isExpired(decoded)) {
          set({ token: null, user: null, isAuthenticated: false, isRestoring: false });
          return false;
        }
        set({
          token,
          user: toAuthUser(decoded, username),
          isAuthenticated: true,
          isRestoring: false,
        });
        return true;
      },
      refreshSession: () => {
        if (refreshPromise) return refreshPromise;
        const epoch = sessionEpoch;
        refreshPromise = (async (): Promise<RefreshOutcome> => {
          try {
            const res = await refreshStoreSession();
            if (epoch !== sessionEpoch) return "rejected";
            const username = get().user?.username || decodeToken(res.token)?.sub || "";
            if (get().setToken(res.token, username)) return "refreshed";
            await get().logout();
            return "rejected";
          } catch (err) {
            if (epoch !== sessionEpoch) return "rejected";
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              // invalid_refresh_token / refresh_token_reused / user_inactive / store_inactive.
              toast.error(mapAuthError(err));
              await get().logout();
              return "rejected";
            }
            // Network, 5xx, 429: keep the session; the session keeper retries later.
            return "unavailable";
          } finally {
            refreshPromise = null;
          }
        })();
        return refreshPromise;
      },
      restoreSession: async () => {
        const outcome = await get().refreshSession();
        if (outcome === "unavailable" && get().isRestoring) {
          // Offline at boot: let the user in on the expired token instead of the login screen;
          // the 401 interceptor refreshes once the network is back.
          set({ isRestoring: false, isAuthenticated: true });
        }
        return outcome;
      },
      logout: () => {
        if (logoutPromise) return logoutPromise;
        sessionEpoch += 1;
        logoutPromise = (async () => {
          if (isStoreRole(get().user?.role)) {
            // Revoke the refresh cookie first; a failure must never block the local logout.
            await logoutStoreSession().catch(() => undefined);
          }
          useStoreProfileStore.getState().reset();
          useNotificationStore.getState().reset();
          useCashShiftStore.getState().reset();
          set({ token: null, user: null, isAuthenticated: false, isRestoring: false });
        })().finally(() => {
          logoutPromise = null;
        });
        return logoutPromise;
      },
    }),
    {
      name: "grocery-pos-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      // Runs synchronously inside create() (localStorage hydration), before `useAuthStore` exists:
      // only mutate `state` here — the boot refresh is started by startSessionKeeper() in main.tsx.
      onRehydrateStorage: () => (state) => {
        if (!state?.token) return;
        const decoded = decodeToken(state.token);
        if (!decoded) {
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
          return;
        }
        state.user = toAuthUser(decoded, state.user?.username || decoded.sub);
        if (!isExpired(decoded)) {
          state.isAuthenticated = true;
          return;
        }
        if (isStoreRole(decoded.role)) {
          // Expired store session: keep token + user and try the refresh cookie before giving up.
          state.isAuthenticated = false;
          state.isRestoring = true;
          return;
        }
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      },
    },
  ),
);
