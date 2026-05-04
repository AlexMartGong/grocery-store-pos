import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductPricesRequest,
  UpdateProductRequest,
} from "../types";

export async function getProducts(
  page = 0,
  size = 20,
  active?: boolean,
  search?: string,
): Promise<PageResponse<ProductResponse>> {
  const res = await apiClient.get<PageResponse<ProductResponse>>("/products", {
    params: {
      page,
      size,
      ...(active !== undefined ? { active } : {}),
      ...(search ? { search } : {}),
    },
  });
  return res.data;
}

export async function getProductById(id: string): Promise<ProductResponse> {
  const res = await apiClient.get<ProductResponse>(`/products/${id}`);
  return res.data;
}

export async function createProduct(data: CreateProductRequest): Promise<ProductResponse> {
  const res = await apiClient.post<ProductResponse>("/products", data);
  return res.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest,
): Promise<ProductResponse> {
  const res = await apiClient.put<ProductResponse>(`/products/${id}`, data);
  return res.data;
}

export async function updateProductPrices(
  id: string,
  data: UpdateProductPricesRequest,
): Promise<ProductResponse> {
  const res = await apiClient.patch<ProductResponse>(`/products/${id}/price`, data);
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}
