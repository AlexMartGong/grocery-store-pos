import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type {
  CancellationReason,
  CancelSaleRequest,
  CreateSaleRequest,
  SaleResponse,
} from "../types";

export async function createSale(data: CreateSaleRequest): Promise<SaleResponse> {
  const res = await apiClient.post<SaleResponse>("/sales", data);
  return res.data;
}

export async function getSales(params: {
  page: number;
  size: number;
  sort?: string;
  customerId?: string;
  paymentMethod?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PageResponse<SaleResponse>> {
  const {
    page,
    size,
    sort = "createdAt,desc",
    customerId,
    paymentMethod,
    search,
    startDate,
    endDate,
  } = params;
  const res = await apiClient.get<PageResponse<SaleResponse>>("/sales", {
    params: {
      page,
      size,
      sort,
      ...(customerId ? { customerId } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(search ? { search } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
  });
  return res.data;
}

export async function cancelSale(
  saleId: string,
  reason: CancellationReason,
  notes?: string,
): Promise<void> {
  const body: CancelSaleRequest = { reason, notes };
  await apiClient.post(`/sales/${saleId}/cancel`, body);
}
