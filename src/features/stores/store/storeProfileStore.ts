import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMyStoreProfile } from "../api/storesApi";
import type { StoreProfileResponse } from "../types";

interface StoreProfileState {
  profile: StoreProfileResponse | null;
  hasFetched: boolean;
  fetchProfile: () => Promise<void>;
  reset: () => void;
}

export const useStoreProfileStore = create<StoreProfileState>()(
  persist(
    (set) => ({
      profile: null,
      hasFetched: false,
      fetchProfile: async () => {
        try {
          const profile = await getMyStoreProfile();
          set({ profile, hasFetched: true });
        } catch (err) {
          console.error("Failed to load store profile", err);
          set({ hasFetched: true });
        }
      },
      reset: () => set({ profile: null, hasFetched: false }),
    }),
    {
      name: "grocery-store-profile",
      partialize: (state) => ({ profile: state.profile }),
    },
  ),
);
