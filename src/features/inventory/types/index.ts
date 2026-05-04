export type InventoryReason = "RESTOCK" | "LOSS" | "ADJUSTMENT";

export interface AdjustStockRequest {
  product_id: string;
  quantity: string;
  reason: InventoryReason;
  notes?: string;
}
