import { jwtDecode } from "jwt-decode";
import type { AuthUser, DecodedToken } from "../types";

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function isExpired(decoded: DecodedToken): boolean {
  return decoded.exp * 1000 < Date.now();
}

export function toAuthUser(decoded: DecodedToken, username: string): AuthUser {
  return {
    role: decoded.role,
    username,
    storeId: decoded.storeId,
    userId: decoded.userId,
    adminId: decoded.adminId,
  };
}
