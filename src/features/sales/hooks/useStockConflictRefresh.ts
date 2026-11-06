import { useCallback } from "react";
import { getProductById } from "../../products/api/productsApi";
import { usePosStore } from "../store/posStore";

/**
 * After a checkout fails with `insufficient_stock` (stock changed in another session), reloads the
 * catalog and refreshes every cart line's `currentStock`. Lines are fetched by id because the
 * catalog page is search-filtered and capped, so it may not contain the culprit; there is no bulk
 * endpoint. Rare error path — one GET per line is acceptable. Failed GETs just leave that line as is.
 */
export function useStockConflictRefresh(reloadCatalog: () => void) {
  const syncStock = usePosStore((s) => s.syncStock);

  return useCallback(async () => {
    reloadCatalog();
    const ids = usePosStore.getState().cart.map((i) => i.productId);
    const fresh = await Promise.all(ids.map((id) => getProductById(id).catch(() => null)));
    syncStock(fresh.filter((p): p is NonNullable<typeof p> => p !== null));
  }, [reloadCatalog, syncStock]);
}
