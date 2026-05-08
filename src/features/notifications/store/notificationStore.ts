import { create } from "zustand";
import { getUnreadNotifications, markNotificationRead } from "../api/notificationApi";
import type { NotificationResponse } from "../types";
import { mapNotificationsError } from "../utils/errorMessages";

interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchUnread: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const INITIAL = {
  notifications: [] as NotificationResponse[],
  unreadCount: 0,
  isLoading: false,
  error: null as string | null,
  hasFetched: false,
};

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  ...INITIAL,
  fetchUnread: async () => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await getUnreadNotifications();
      set({
        notifications,
        unreadCount: notifications.length,
        hasFetched: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: mapNotificationsError(err),
        hasFetched: true,
        isLoading: false,
      });
    }
  },
  markAsRead: async (id) => {
    const prevNotifications = get().notifications;
    const prevCount = get().unreadCount;
    set({
      notifications: prevNotifications.filter((n) => n.id !== id),
      unreadCount: Math.max(0, prevCount - 1),
      error: null,
    });
    try {
      await markNotificationRead(id);
    } catch (err) {
      set({
        notifications: prevNotifications,
        unreadCount: prevCount,
        error: mapNotificationsError(err),
      });
    }
  },
  clearError: () => set({ error: null }),
  reset: () => set({ ...INITIAL }),
}));
