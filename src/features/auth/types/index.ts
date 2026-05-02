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
  storeId?: number;
  userId?: number;
  adminId?: number;
}

export interface AuthUser {
  role: UserRole;
  username: string;
  storeId?: number;
  userId?: number;
  adminId?: number;
}
