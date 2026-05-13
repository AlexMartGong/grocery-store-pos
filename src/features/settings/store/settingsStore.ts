import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scanLocalNetworkForAgent } from "../../../shared/api/agentApi";

const DEFAULT_AGENT_URL = "http://192.168.68.66:8081";

const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_AGENT_URL;
};

interface SettingsState {
  localAgentUrl: string;
  setLocalAgentUrl: (url: string) => void;
  autoDiscoverAgent: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      localAgentUrl: DEFAULT_AGENT_URL,
      setLocalAgentUrl: (url) => set({ localAgentUrl: normalizeUrl(url) }),
      autoDiscoverAgent: async () => {
        try {
          const found = await scanLocalNetworkForAgent();
          set({ localAgentUrl: normalizeUrl(found) });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "grocery-pos-settings",
      partialize: (state) => ({ localAgentUrl: state.localAgentUrl }),
    },
  ),
);

export { DEFAULT_AGENT_URL };
