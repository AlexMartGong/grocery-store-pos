import { jwtDecode } from "jwt-decode";
import type { AuthUser, DecodedToken, UserRole } from "../types";

const VALID_ROLES: readonly UserRole[] = ["OWNER", "CASHIER", "SUPER_ADMIN"];

export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Reject tampered tokens that are valid base64 JSON but malformed: a missing
    // numeric `exp` would make isExpired() compute NaN < now → false (never
    // expired), and an unknown role would grant access. Shape-check both.
    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.exp !== "number" ||
      !VALID_ROLES.includes(decoded.role)
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function isExpired(decoded: DecodedToken): boolean {
  return decoded.exp * 1000 < Date.now();
}

/** Milliseconds until `exp` (negative once expired). */
export function msUntilExpiry(decoded: DecodedToken): number {
  return decoded.exp * 1000 - Date.now();
}

/** Store users (OWNER/CASHIER) hold a refresh cookie; SUPER_ADMIN does not. */
export function isStoreRole(role: UserRole | undefined): role is "OWNER" | "CASHIER" {
  return role === "OWNER" || role === "CASHIER";
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
