import { API_BASE_URL, api, getAccessToken } from "@/lib/api/apiClient";

export interface NotificationItem {
  notificationId: string;
  title: string;
  body: string;
  senderName?: string;
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

interface BackendNotification {
  id: string;
  eventId?: string;
  recipientUserId?: string;
  title: string;
  body: string;
  sentAt: string;
  sentByUserId?: string;
  senderName?: string;
  isRead: boolean;
}

interface BackendNotificationPage {
  data: BackendNotification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  statusCode: number;
  message: string;
}

interface BackendEnvelope<T> {
  data: T;
  statusCode: number;
  message: string;
}

function mapNotification(item: BackendNotification): NotificationItem {
  return {
    notificationId: item.id,
    title: item.title,
    body: item.body,
    senderName: item.senderName,
    eventId: item.eventId,
    read: item.isRead,
    createdAt: item.sentAt,
  };
}

export const notificationService = {
  getMyNotifications: async (page = 0, size = 20): Promise<NotificationPage> => {
    const response = await api.get<BackendNotificationPage>(
      `/api/v1/notifications/getMyNotifications?page=${page}&size=${size}`,
    );
    return {
      content: (response.data ?? []).map(mapNotification),
      totalElements: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0,
      number: response.currentPage ?? page,
      size,
    };
  },

  getUnreadCount: async () => {
    const response = await api.get<BackendEnvelope<number>>("/api/v1/notifications/unread-count");
    return { count: response.data ?? 0 };
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.patch<BackendEnvelope<BackendNotification>>(
      `/api/v1/notifications/${notificationId}/read`,
    );
    return response.data ? mapNotification(response.data) : undefined;
  },

  markAllAsRead: async () => {
    const response = await api.patch<BackendEnvelope<number>>("/api/v1/notifications/read-all");
    return { count: response.data ?? 0 };
  },

  delete: (notificationId: string) =>
    api.delete(`/api/v1/notifications/deleteNotification/${notificationId}`),

  // Admin send
  sendToUser: async (data: { recipientUserId: string; eventId?: string; title: string; body: string }) => {
    const response = await api.post<BackendEnvelope<BackendNotification>>(
      "/api/v1/notifications/sendNotificationToUser",
      data,
    );
    return response.data ? mapNotification(response.data) : undefined;
  },
  sendToEmail: async (data: { recipientEmail: string; eventId?: string; title: string; body: string }) => {
    const response = await api.post<BackendEnvelope<BackendNotification>>(
      "/api/v1/notifications/sendNotificationToEmail",
      data,
    );
    return response.data ? mapNotification(response.data) : undefined;
  },
  broadcast: async (data: { recipientUserIds: string[]; eventId?: string; title: string; body: string }) => {
    const response = await api.post<BackendEnvelope<BackendNotification[]>>(
      "/api/v1/notifications/sendBroadcastNotification",
      data,
    );
    return (response.data ?? []).map(mapNotification);
  },

  // SSE stream — returns EventSource for real-time notifications
  createStream: (): EventSource | null => {
    const token = getAccessToken();
    if (!token) return null;
    // SSE doesn't support custom headers natively — pass token as query param if backend supports it
    const url = `${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
    return new EventSource(url);
  },
};
