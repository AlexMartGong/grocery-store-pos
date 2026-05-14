import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCashShiftStore } from "../../cash/store/cashShiftStore";
import { useNotificationStore } from "../../notifications/store/notificationStore";
import { useStoreProfileStore } from "../../stores/store/storeProfileStore";
import type { AuthUser } from "../types";
import { decodeToken, isExpired, toAuthUser } from "../utils/token";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setToken: (token: string, username: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token, username) => {
        const decoded = decodeToken(token);
        if (!decoded || isExpired(decoded)) {
          set({ token: null, user: null, isAuthenticated: false });
          return false;
        }
        set({
          token,
          user: toAuthUser(decoded, username),
          isAuthenticated: true,
        });
        return true;
      },
      logout: () => {
        useStoreProfileStore.getState().reset();
        useNotificationStore.getState().reset();
        useCashShiftStore.getState().reset();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "grocery-pos-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (!state?.token) return;
        const decoded = decodeToken(state.token);
        if (!decoded || isExpired(decoded)) {
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
          return;
        }
        state.user = toAuthUser(decoded, state.user?.username ?? "");
        state.isAuthenticated = true;
      },
    },
  ),
);
