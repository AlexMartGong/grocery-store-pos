import { useCallback, useEffect, useState } from "react";
import { getCustomers } from "../../customers/api/customersApi";
import type { CustomerResponse } from "../../customers/types";
import { mapCustomersError } from "../../customers/utils/errorMessages";

export function usePosCustomers() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomers(0, 100, true);
      setCustomers(res.content);
    } catch (err) {
      setError(mapCustomersError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { customers, loading, error };
}
