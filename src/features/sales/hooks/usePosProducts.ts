import { useCallback, useState } from "react";
import { getProducts } from "../../products/api/productsApi";
import type { ProductResponse } from "../../products/types";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import { mapProductsError } from "../../products/utils/errorMessages";

const POS_PAGE_SIZE = 40;
const NO_PRODUCTS: ProductResponse[] = [];

export function usePosProducts() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const fetchProducts = useCallback(
    () => getProducts(0, POS_PAGE_SIZE, true, debouncedSearch || undefined),
    [debouncedSearch],
  );
  const { data, loading, error } = useAsyncData(fetchProducts, mapProductsError);

  return { products: data?.content ?? NO_PRODUCTS, loading, error, searchInput, setSearchInput };
}
