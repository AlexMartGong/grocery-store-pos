export type NotificationType = "LOW_STOCK" | "OUT_OF_STOCK" | "OVERDUE_CREDIT";

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
}
