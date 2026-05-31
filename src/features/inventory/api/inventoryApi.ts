import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type { AdjustStockRequest, InventoryMovementResponse } from "../types";

export async function adjustStock(data: AdjustStockRequest): Promise<void> {
  await apiClient.post("/inventory/movements", data);
}

// Kárdex history for one product. Backend repo already orders createdAt DESC — no `sort` param.
export async function getProductMovements(
  productId: string,
  page = 0,
  size = 20,
): Promise<PageResponse<InventoryMovementResponse>> {
  const res = await apiClient.get<PageResponse<InventoryMovementResponse>>(
    "/inventory/movements",
    { params: { productId, page, size } },
  );
  return res.data;
}
