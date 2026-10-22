import { useCallback, useEffect, useState } from "react";
import { getPlans } from "../api/subscriptionsApi";
import { mapSubscriptionsError } from "../utils/errorMessages";
import type { SubscriptionPlanResponse } from "../types";

/**
 * The tier catalog, fetched once per mount. Shared by ChangePlanModal (which prices its tier
 * cards from it) and PlansCatalogModal.
 *
 * @param enabled pass the modal's `open` flag so a closed modal never hits the network.
 */
export const usePlansCatalog = (enabled = true) => {
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      setPlans(await getPlans());
    } catch (err) {
      setError(mapSubscriptionsError(err));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { plans, loading, error, reload: load };
};
