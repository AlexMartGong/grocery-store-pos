import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type { CreateSaleRequest, SaleResponse } from "../types";

export async function createSale(data: CreateSaleRequest): Promise<SaleResponse> {
  const res = await apiClient.post<SaleResponse>("/sales", data);
  return res.data;
}

export async function getSales(
  page = 0,
  size = 20,
  sort?: string,
): Promise<PageResponse<SaleResponse>> {
  const res = await apiClient.get<PageResponse<SaleResponse>>("/sales", {
    params: {
      page,
      size,
      ...(sort ? { sort } : {}),
    },
  });
  return res.data;
}
