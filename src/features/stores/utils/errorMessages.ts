import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const STORES_ERROR_MESSAGES: Record<string, string> = {
  store_not_found: "Store not found.",
  store_code_taken: "That store code is already in use.",
  validation_failed: "Please check the highlighted fields and try again.",
  forbidden: "You don't have permission for this action.",
};

const NETWORK_ERROR = "Network error. Please check your connection and try again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export function mapStoresError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && STORES_ERROR_MESSAGES[code]) return STORES_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
