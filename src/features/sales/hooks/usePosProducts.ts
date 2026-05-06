import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../../products/api/productsApi";
import type { ProductResponse } from "../../products/types";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { mapProductsError } from "../../products/utils/errorMessages";

const POS_PAGE_SIZE = 40;

export function usePosProducts() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts(
        0,
        POS_PAGE_SIZE,
        true,
        debouncedSearch || undefined,
      );
      setProducts(res.content);
    } catch (err) {
      setError(mapProductsError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  return { products, loading, error, searchInput, setSearchInput };
}
