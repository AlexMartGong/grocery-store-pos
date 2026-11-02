import axios from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";
import { isStoreRole } from "../../features/auth/utils/token";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    /** Set once a 401 has been answered with a refresh + retry, so a request retries at most once. */
    _authRetried?: boolean;
  }
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// Public auth endpoints: no bearer token, and their 401s are never refreshed or turned into a
// logout (a login 401 is bad credentials; a refresh 401 is handled by refreshSession — no loop).
const AUTH_PATHS = new Set(["/auth/login", "/auth/refresh", "/auth/logout", "/admin/login"]);

export const apiClient = axios.create({
  baseURL: `${API_ROOT}/api/v1`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && !AUTH_PATHS.has(config.url ?? "")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }
    const original = error.config;
    if (AUTH_PATHS.has(original.url ?? "")) return Promise.reject(error);

    const { token, user, logout, refreshSession } = useAuthStore.getState();
    if (!token || !user) return Promise.reject(error);

    // SUPER_ADMIN has no refresh cookie: silent logout as before. A store request that already
    // retried after a refresh and still gets 401 means the session is gone.
    if (!isStoreRole(user.role) || original._authRetried) {
      void logout();
      return Promise.reject(error);
    }
    original._authRetried = true;

    // Sent with a token that has since been replaced (a concurrent refresh already settled):
    // retry with the current one instead of rotating the cookie again.
    if (original.headers.Authorization !== `Bearer ${token}`) return apiClient(original);

    // Concurrent 401s all await the same single-flight refresh.
    const outcome = await refreshSession();
    return outcome === "refreshed" ? apiClient(original) : Promise.reject(error);
  },
);
