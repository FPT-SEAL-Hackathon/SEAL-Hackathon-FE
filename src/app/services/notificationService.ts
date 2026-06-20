import { API_BASE_URL, api, getAccessToken } from "./apiClient";

export interface NotificationItem {
  notificationId: string;
  title: string;
  body: string;
  eventId?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const notificationService = {
  getMyNotifications: (page = 0, size = 20) =>
    api.get<NotificationPage>(`/api/v1/notifications/getMyNotifications?page=${page}&size=${size}`),

  getUnreadCount: () =>
    api.get<{ count: number }>("/api/v1/notifications/unread-count"),

  markAsRead: (notificationId: string) =>
    api.patch<object>(`/api/v1/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.patch<object>("/api/v1/notifications/read-all"),

  delete: (notificationId: string) =>
    api.delete(`/api/v1/notifications/deleteNotification/${notificationId}`),

  // Admin send
  sendToUser: (data: { recipientUserId: string; eventId?: string; title: string; body: string }) =>
    api.post<object>("/api/v1/notifications/sendNotificationToUser", data),
  broadcast: (data: { recipientUserIds: string[]; eventId?: string; title: string; body: string }) =>
    api.post<object>("/api/v1/notifications/sendBroadcastNotification", data),

  // SSE stream — returns EventSource for real-time notifications
  createStream: (): EventSource | null => {
    const token = getAccessToken();
    if (!token) return null;
    // SSE doesn't support custom headers natively — pass token as query param if backend supports it
    const url = `${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
    return new EventSource(url);
  },
};
