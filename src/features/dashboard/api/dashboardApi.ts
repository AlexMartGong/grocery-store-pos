import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type {
  AuditLogResponse,
  ProductToRestockResponse,
  SalesTodayResponse,
} from "../types";

export const getAuditLogs = (page = 0, size = 20) =>
  apiClient
    .get<PageResponse<AuditLogResponse>>("/audit-logs", { params: { page, size } })
    .then((res) => res.data);

export const getSalesToday = () =>
  apiClient.get<SalesTodayResponse>("/dashboard/sales-today").then((res) => res.data);

export const getProductsToRestock = (page = 0, size = 5) =>
  apiClient
    .get<PageResponse<ProductToRestockResponse>>("/dashboard/products-to-restock", {
      params: { page, size },
    })
    .then((res) => res.data);
