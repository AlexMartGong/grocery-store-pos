import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_AGENT_URL = "http://localhost:8081";

const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_AGENT_URL;
};

interface SettingsState {
  localAgentUrl: string;
  setLocalAgentUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      localAgentUrl: DEFAULT_AGENT_URL,
      setLocalAgentUrl: (url) => set({ localAgentUrl: normalizeUrl(url) }),
    }),
    {
      name: "grocery-pos-settings",
      partialize: (state) => ({ localAgentUrl: state.localAgentUrl }),
    },
  ),
);

export { DEFAULT_AGENT_URL };
