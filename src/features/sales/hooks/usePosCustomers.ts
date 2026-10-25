import { getCustomers } from "../../customers/api/customersApi";
import type { CustomerResponse } from "../../customers/types";
import { mapCustomersError } from "../../customers/utils/errorMessages";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";

const NO_CUSTOMERS: CustomerResponse[] = [];
const fetchActiveCustomers = () => getCustomers(0, 100, true);

export function usePosCustomers() {
  const { data, loading, error } = useAsyncData(fetchActiveCustomers, mapCustomersError);
  return { customers: data?.content ?? NO_CUSTOMERS, loading, error };
}
