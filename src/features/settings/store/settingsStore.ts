import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_AGENT_URL = "http://192.168.68.66:8081";

// V-04 (SSRF): only accept http:// URLs pointing at loopback or an RFC1918
// private host (optional port). Blocks https/javascript schemes and public IPs
// so the agent/scale URL can't be weaponized as an SSRF pivot against the LAN.
const PRIVATE_AGENT_URL =
  /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d{1,5})?$/;

const normalizeUrl = (raw: string): string | null => {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_AGENT_URL;
  return PRIVATE_AGENT_URL.test(trimmed) ? trimmed : null;
};

interface SettingsState {
  localAgentUrl: string;
  /** Returns false (keeping the previous URL) when the value is rejected. */
  setLocalAgentUrl: (url: string) => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      localAgentUrl: DEFAULT_AGENT_URL,
      setLocalAgentUrl: (url) => {
        const normalized = normalizeUrl(url);
        if (normalized === null) {
          console.error(
            `[settings] URL de agente rechazada (requiere http:// con IP local): "${url}"`,
          );
          return false;
        }
        set({ localAgentUrl: normalized });
        return true;
      },
    }),
    {
      name: "grocery-pos-settings",
      partialize: (state) => ({ localAgentUrl: state.localAgentUrl }),
    },
  ),
);

export { DEFAULT_AGENT_URL };
