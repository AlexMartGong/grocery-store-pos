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
