export type UserRole = "OWNER" | "CASHIER" | "SUPER_ADMIN";

export interface LoginRequest {
  storeCode: string;
  username: string;
  password: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
}

export interface ApiErrorResponse {
  error: string;
  message: string | null;
  fields: Record<string, string> | null;
}

export interface DecodedToken {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  role: UserRole;
  storeId?: string;
  userId?: string;
  adminId?: string;
}

export interface AuthUser {
  role: UserRole;
  username: string;
  storeId?: string;
  userId?: string;
  adminId?: string;
}

/**
 * Result of a store-session refresh: `rejected` = backend refused it (401) and the session was
 * logged out; `unavailable` = transient failure (network, 5xx, 429) — session kept, retry later.
 */
export type RefreshOutcome = "refreshed" | "rejected" | "unavailable";
