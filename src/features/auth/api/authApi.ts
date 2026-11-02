import { apiClient } from "../../../shared/api/api";
import type { AdminLoginRequest, LoginRequest, LoginResponse } from "../types";

// Store-user auth endpoints carry the httpOnly `refresh_token` cookie (Path=/api/v1/auth), so they
// — and only they — send credentials. The admin login has no cookie and stays credential-less.
export async function loginStore(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", data, {
    withCredentials: true,
  });
  return res.data;
}

/** Rotates the refresh cookie and returns a fresh access token. No body, no Authorization. */
export async function refreshStoreSession(): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/refresh", undefined, {
    withCredentials: true,
  });
  return res.data;
}

/** Revokes the refresh token and clears its cookie. Backend always answers 204. */
export async function logoutStoreSession(): Promise<void> {
  // Short timeout: logout awaits this call before clearing local state, so an
  // offline device must not keep the user "logged in" for apiClient's 15 s.
  await apiClient.post("/auth/logout", undefined, {
    withCredentials: true,
    timeout: 5000,
  });
}

export async function loginAdmin(data: AdminLoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/admin/login", data);
  return res.data;
}
