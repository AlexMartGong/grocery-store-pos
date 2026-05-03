import type { UserRole } from "../../auth/types";

export type { UserRole };

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
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

// Backend also accepts optional `password` and `active`; intentionally omitted.
// Password reset and deactivation belong to dedicated flows.
export interface UpdateUserRequest {
  fullName: string;
  role: UserRole;
}
