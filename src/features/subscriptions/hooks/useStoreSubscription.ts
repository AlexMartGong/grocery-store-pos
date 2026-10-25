import { useMemo } from "react";
import { getStoreSubscription } from "../api/subscriptionsApi";
import { mapSubscriptionsError } from "../utils/errorMessages";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";

/**
 * A store's current plan, or `null` when it has never subscribed — the API maps that 404 to null,
 * so "no plan" is a value here, not an error. Pass `null` for `storeId` to clear.
 */
export const useStoreSubscription = (storeId: string | null) => {
  const fetchSubscription = useMemo(
    () => (storeId ? () => getStoreSubscription(storeId) : null),
    [storeId],
  );
  const { data, loading, error } = useAsyncData(fetchSubscription, mapSubscriptionsError);
  // Never hand out a previous store's plan while the next loads or after it fails: ChangePlanModal
  // preselects from it.
  return { subscription: storeId && !loading && !error ? (data ?? null) : null, loading, error };
};
