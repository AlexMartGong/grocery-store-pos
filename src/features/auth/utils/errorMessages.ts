import axios from "axios";
import type { ApiErrorResponse } from "../types";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid username or password.",
  store_inactive: "This store is currently inactive. Contact your administrator.",
  store_not_found: "Store not found. Verify the store code.",
  validation_failed: "Please check the highlighted fields and try again.",
  conflict: "Request conflicts with current state.",
};

const NETWORK_ERROR = "Network error. Please check your connection and try again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export function mapAuthError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
