import axios from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: `${API_ROOT}/api/v1`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
