import { useCallback, useEffect, useState } from "react";
import { getStoreSubscription } from "../api/subscriptionsApi";
import { mapSubscriptionsError } from "../utils/errorMessages";
import type { SubscriptionResponse } from "../types";

/**
 * A store's current plan, or `null` when it has never subscribed — the API maps that 404 to null,
 * so "no plan" is a value here, not an error. Pass `null` for `storeId` to clear.
 */
export const useStoreSubscription = (storeId: string | null) => {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) {
      setSubscription(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSubscription(await getStoreSubscription(storeId));
    } catch (err) {
      setError(mapSubscriptionsError(err));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { subscription, loading, error };
};
