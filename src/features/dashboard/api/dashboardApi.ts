import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type { AuditLogResponse } from "../types";

export const getAuditLogs = (page = 0, size = 20) =>
  apiClient
    .get<PageResponse<AuditLogResponse>>("/audit-logs", { params: { page, size } })
    .then((res) => res.data);
