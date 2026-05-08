import { apiClient } from "../../../shared/api/api";
import type { NotificationResponse } from "../types";

export const getUnreadNotifications = async (): Promise<NotificationResponse[]> => {
  const { data } = await apiClient.get<NotificationResponse[]>("/notifications/unread");
  return data;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};
