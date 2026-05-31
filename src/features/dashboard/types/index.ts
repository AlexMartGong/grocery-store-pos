export interface AuditLogResponse {
  id: string;
  userId: string | null;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>; // backend Map<String,Object>; `any` banned by CLAUDE.md
  createdAt: string; // ISO-8601 offset
}

// GET /dashboard/sales-today — backend camelCase; BigDecimal as string (CLAUDE.md).
export interface SalesTodayResponse {
  tickets: number;
  dayTotal: string;
  dayCollected: string;
  dayOnCredit: string;
}

// GET /dashboard/products-to-restock — only products at/below minimum are returned.
export interface ProductToRestockResponse {
  productId: string;
  name: string;
  currentStock: string;
  minimumStock: string;
}
