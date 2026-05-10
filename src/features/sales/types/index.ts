import type { UnitOfMeasure } from "../../products/types";

export type { UnitOfMeasure };

export type SalePaymentMethod = "CASH" | "CARD" | "TRANSFER" | "CREDIT" | "MIXED";

export type SaleStatus = "COMPLETED" | "CANCELED";

export interface SaleItemRequest {
  product_id: string;
  quantity: string;
  unit_price: string;
}

export interface CreateSaleRequest {
  payment_method: SalePaymentMethod;
  customer_id?: string;
  amount_paid?: string;
  items: SaleItemRequest[];
}

export interface SaleItemResponse {
  id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
}

export interface SaleResponse {
  id: string;
  store_id: string;
  cashier_id: string | null;
  customer_id: string | null;
  payment_method: SalePaymentMethod;
  total_amount: string;
  amount_paid: string;
  amount_credited: string;
  status: SaleStatus;
  created_at: string;
  items: SaleItemResponse[];
}

export interface CartItem {
  productId: string;
  name: string;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitOfMeasure: UnitOfMeasure;
}

export type CancellationReason =
  | "CASHIER_ERROR"
  | "CUSTOMER_REGRET"
  | "WRONG_PRODUCT"
  | "OTHER";

export interface CancelSaleRequest {
  reason: CancellationReason;
  notes?: string;
}
