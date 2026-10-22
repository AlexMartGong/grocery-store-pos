import axios from "axios";
import { apiClient } from "../../../shared/api/api";
import type {
  ChangePlanRequest,
  SubscriptionPlanResponse,
  SubscriptionResponse,
  SubscriptionSummaryResponse,
  UpcomingBillingResponse,
} from "../types";

/** Active tiers only, cheapest first — the backend filters and sorts. */
export const getPlans = async (): Promise<SubscriptionPlanResponse[]> => {
  const { data } = await apiClient.get<SubscriptionPlanResponse[]>("/admin/plans");
  return data;
};

export const getUpcomingBillings = async (): Promise<UpcomingBillingResponse[]> => {
  const { data } = await apiClient.get<UpcomingBillingResponse[]>(
    "/admin/subscriptions/upcoming-billings",
  );
  return data;
};

export const getSubscriptionsSummary = async (): Promise<SubscriptionSummaryResponse> => {
  const { data } = await apiClient.get<SubscriptionSummaryResponse>(
    "/admin/subscriptions/summary",
  );
  return data;
};

/**
 * A store with no subscription is a normal state, not a failure — 404 maps to `null` so callers
 * can render "sin suscripción" instead of an error. Every other status propagates.
 * Mirrors `cashApi.getCurrentShift` / `productsApi.searchByBarcode`.
 */
export const getStoreSubscription = async (
  storeId: string,
): Promise<SubscriptionResponse | null> => {
  try {
    const { data } = await apiClient.get<SubscriptionResponse>(
      `/admin/stores/${storeId}/subscription`,
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
};

/** Subscribes, switches or renews. Always 201 — the backend appends a new subscription row. */
export const changePlan = async (
  storeId: string,
  data: ChangePlanRequest,
): Promise<SubscriptionResponse> => {
  const { data: res } = await apiClient.post<SubscriptionResponse>(
    `/admin/stores/${storeId}/subscription`,
    data,
  );
  return res;
};
