import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const USERS_ERROR_MESSAGES: Record<string, string> = {
  username_taken: "That username is already in use.",
  user_not_found: "User not found.",
  validation_failed: "Please check the highlighted fields and try again.",
  forbidden: "You don't have permission for this action.",
};

const NETWORK_ERROR = "Network error. Please check your connection and try again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export function mapUsersError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && USERS_ERROR_MESSAGES[code]) return USERS_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
