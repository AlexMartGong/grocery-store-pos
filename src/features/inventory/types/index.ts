export type InventoryReason = "RESTOCK" | "LOSS" | "ADJUSTMENT";

export interface AdjustStockRequest {
  product_id: string;
  quantity: string;
  reason: InventoryReason;
  notes?: string;
}

// Kárdex (read-only movement history). Wire format is camelCase (no @JsonProperty on the
// backend DTO). `quantity` is a signed delta (+ add / − subtract); typed `number` because this
// is display-only and never re-sent — see the "Number() for display-only" allowance in CLAUDE.md.
// `reason` is `string` (not InventoryReason) because SALE/CANCELLATION also appear in history.
export interface InventoryMovementResponse {
  id: string;
  productId: string;
  quantity: number;
  reason: string;
  notes: string | null;
  createdAt: string;
}
