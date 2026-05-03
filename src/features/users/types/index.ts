import type { UserRole } from "../../auth/types";

export type { UserRole };

export interface UserResponse {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
}
