import { apiClient } from "../../../shared/api/api";
import type { AdminLoginRequest, LoginRequest, LoginResponse } from "../types";

export async function loginStore(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", data);
  return res.data;
}

export async function loginAdmin(data: AdminLoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/admin/login", data);
  return res.data;
}
