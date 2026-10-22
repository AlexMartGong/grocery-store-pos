import { useCallback, useEffect, useState } from "react";
import { getSubscriptionsSummary, getUpcomingBillings } from "../api/subscriptionsApi";
import { mapSubscriptionsError } from "../utils/errorMessages";
import type { SubscriptionSummaryResponse, UpcomingBillingResponse } from "../types";

/**
 * Loads the two reads behind the admin subscriptions screen. They are fetched together because
 * the KPI header's 7-day figures are derived from the same server-side query as the table — a
 * partial refresh would let the two disagree.
 */
export const useSubscriptionsOverview = () => {
  const [summary, setSummary] = useState<SubscriptionSummaryResponse | null>(null);
  const [billings, setBillings] = useState<UpcomingBillingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, billingsData] = await Promise.all([
        getSubscriptionsSummary(),
        getUpcomingBillings(),
      ]);
      setSummary(summaryData);
      setBillings(billingsData);
    } catch (err) {
      setError(mapSubscriptionsError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, billings, loading, error, reload: load };
};
