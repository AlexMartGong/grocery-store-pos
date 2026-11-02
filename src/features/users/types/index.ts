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

// Backend also accepts optional `active`; intentionally omitted (deactivation = DELETE).
// Sending `password` changes it and revokes every session (refresh token) of that user.
export interface UpdateUserRequest {
  fullName: string;
  role: UserRole;
  password?: string;
}
