export type UnitOfMeasure = "PIECE" | "KILO";

export interface ProductResponse {
  id: string;
  barcode: string | null;
  name: string;
  purchase_cost: string;
  sale_price: string;
  current_stock: string;
  minimum_stock: string;
  unit_of_measure: UnitOfMeasure;
  image_url?: string | null;
  active: boolean;
  updated_at: string;
}

export interface CreateProductRequest {
  barcode?: string;
  name: string;
  purchase_cost?: string;
  sale_price: string;
  current_stock: string;
  minimum_stock: string;
  unit_of_measure: UnitOfMeasure;
}

export type UpdateProductRequest = CreateProductRequest;

export interface UpdateProductPricesRequest {
  sale_price?: string;
  purchase_cost?: string;
}
