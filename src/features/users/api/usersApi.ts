import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UserRole,
} from "../types";

export async function getUsers(
  page = 0,
  size = 10,
  active?: boolean,
  role?: UserRole,
): Promise<PageResponse<UserResponse>> {
  const res = await apiClient.get<PageResponse<UserResponse>>("/users", {
    params: { page, size, active, role },
  });
  return res.data;
}

export async function getUserById(id: string): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>(`/users/${id}`);
  return res.data;
}

export async function createUser(data: CreateUserRequest): Promise<UserResponse> {
  const res = await apiClient.post<UserResponse>("/users", data);
  return res.data;
}

export async function updateUser(
  id: string,
  data: UpdateUserRequest,
): Promise<UserResponse> {
  const res = await apiClient.put<UserResponse>(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
