import { apiClient } from "../../../shared/api/api";
import type { AdjustStockRequest } from "../types";

export async function adjustStock(data: AdjustStockRequest): Promise<void> {
  await apiClient.post("/inventory/movements", data);
}
