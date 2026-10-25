import { getPlans } from "../api/subscriptionsApi";
import { mapSubscriptionsError } from "../utils/errorMessages";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import type { SubscriptionPlanResponse } from "../types";

const NO_PLANS: SubscriptionPlanResponse[] = [];

/**
 * The tier catalog. Shared by ChangePlanModal (which prices its tier cards from it) and
 * PlansCatalogModal.
 *
 * @param enabled pass the modal's `open` flag so a closed modal never hits the network.
 */
export const usePlansCatalog = (enabled = true) => {
  const { data, loading, error, reload } = useAsyncData(
    enabled ? getPlans : null,
    mapSubscriptionsError,
  );
  return { plans: data ?? NO_PLANS, loading, error, reload };
};
