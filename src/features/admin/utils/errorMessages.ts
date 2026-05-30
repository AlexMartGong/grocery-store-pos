import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const ADMIN_PROVISIONING_ERROR_MESSAGES: Record<string, string> = {
  username_taken: "That username is already in use.",
  store_not_active: "The store is not active. Activate it before provisioning an owner.",
  store_owner_exists: "This store already has an active owner assigned.",
  store_not_found: "Store not found.",
  validation_failed: "Please check the highlighted fields and try again.",
  forbidden: "You don't have permission for this action.",
};

const NETWORK_ERROR = "Network error. Please check your connection and try again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export function mapAdminProvisioningError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && ADMIN_PROVISIONING_ERROR_MESSAGES[code]) {
      return ADMIN_PROVISIONING_ERROR_MESSAGES[code];
    }
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}

// Codes for POST /admin/stores/:storeId/payments — kept separate from the provisioning
// map so neither leaks unrelated error codes into the other.
export const SAAS_PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  subscription_not_found: "This store has no active subscription to bill.",
  validation_failed: "Please check the highlighted fields and try again.",
  forbidden: "You don't have permission for this action.",
};

export function mapSaasPaymentError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && SAAS_PAYMENT_ERROR_MESSAGES[code]) {
      return SAAS_PAYMENT_ERROR_MESSAGES[code];
    }
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
