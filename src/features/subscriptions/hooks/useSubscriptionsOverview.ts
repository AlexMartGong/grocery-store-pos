import { getSubscriptionsSummary, getUpcomingBillings } from "../api/subscriptionsApi";
import { mapSubscriptionsError } from "../utils/errorMessages";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import type { UpcomingBillingResponse } from "../types";

const NO_BILLINGS: UpcomingBillingResponse[] = [];
const fetchOverview = () => Promise.all([getSubscriptionsSummary(), getUpcomingBillings()]);

/**
 * Loads the two reads behind the admin subscriptions screen. They are fetched together because
 * the KPI header's 7-day figures are derived from the same server-side query as the table — a
 * partial refresh would let the two disagree.
 */
export const useSubscriptionsOverview = () => {
  const { data, loading, error, reload } = useAsyncData(fetchOverview, mapSubscriptionsError);
  return { summary: data?.[0] ?? null, billings: data?.[1] ?? NO_BILLINGS, loading, error, reload };
};
