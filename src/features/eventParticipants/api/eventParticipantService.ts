import { api, ApiError } from "@/lib/api/apiClient";

export type EventParticipantStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "TEMPORARY"
  | "UNVERIFIED";

export const EVENT_PARTICIPANT_STATUSES: EventParticipantStatus[] = [
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "TEMPORARY",
  "UNVERIFIED",
];

export interface EventParticipantResponse {
  participantId: string;
  eventParticipantId?: string;
  userId: string;
  fullName: string;
  studentCode?: string;
  fptStudentCode?: string;
  externalStudentCode?: string;
  university?: string;
  universityName?: string;
  email: string;
  avatarUrl?: string;
  eventId: string;
  eventName: string;
  categoryId?: string;
  categoryName?: string;
  status: EventParticipantStatus;
  appliedAt?: string;
  registeredAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectedReason?: string;
}

export interface EventParticipantsQuery {
  eventId?: string;
  categoryId?: string;
  status?: string;
  keyword?: string;
  university?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface EventParticipantsPage {
  content: EventParticipantResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface BackendEnvelope<T> {
  data?: T;
  content?: EventParticipantResponse[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  page?: number;
  size?: number;
  message?: string;
}

function paramsFromQuery(query: EventParticipantsQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

function unwrapPage(response: EventParticipantResponse[] | BackendEnvelope<EventParticipantsPage | EventParticipantResponse[]>): EventParticipantsPage {
  if (Array.isArray(response)) {
    return {
      content: response,
      totalElements: response.length,
      totalPages: 1,
      number: 0,
      size: response.length,
    };
  }

  const data = response.data;
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      size: data.length,
    };
  }

  if (data && !Array.isArray(data) && Array.isArray(data.content)) {
    return {
      content: data.content,
      totalElements: data.totalElements ?? data.content.length,
      totalPages: data.totalPages ?? 1,
      number: data.number ?? 0,
      size: data.size ?? data.content.length,
    };
  }

  if (Array.isArray(response.content)) {
    return {
      content: response.content,
      totalElements: response.totalElements ?? response.content.length,
      totalPages: response.totalPages ?? 1,
      number: response.number ?? response.page ?? 0,
      size: response.size ?? response.content.length,
    };
  }

  throw new Error(response.message ?? "Unexpected event participants response from server.");
}

function normalizeSingle(response: EventParticipantResponse | BackendEnvelope<EventParticipantResponse>) {
  return "data" in response && response.data && !Array.isArray(response.data)
    ? response.data
    : response as EventParticipantResponse;
}

export const eventParticipantService = {
  getOrganizerParticipants: async (query: EventParticipantsQuery) => {
    const qs = paramsFromQuery(query);
    return unwrapPage(await api.get<EventParticipantResponse[] | BackendEnvelope<EventParticipantsPage | EventParticipantResponse[]>>(
      `/api/v1/organizer/event-participants${qs ? `?${qs}` : ""}`,
    ));
  },

  updateStatus: (participantId: string, status: EventParticipantStatus, rejectedReason?: string) =>
    api.patch<EventParticipantResponse>(`/api/v1/organizer/event-participants/${participantId}/status`, {
      status,
      rejectedReason: rejectedReason?.trim() || undefined,
    }),

  bulkUpdateStatus: (participantIds: string[], status: EventParticipantStatus, rejectedReason?: string) =>
    api.patch<void>("/api/v1/organizer/event-participants/status", {
      participantIds,
      status,
      rejectedReason: rejectedReason?.trim() || undefined,
    }),

  register: (eventId: string) =>
    api.post<EventParticipantResponse>(`/api/v1/events/${eventId}/participants/register`, {}),

  getMyParticipation: async (eventId: string) =>
    normalizeSingle(await api.get<EventParticipantResponse | BackendEnvelope<EventParticipantResponse>>(
      `/api/v1/events/${eventId}/participants/me`,
    )),

  getMyParticipations: async () => {
    const response = await api.get<EventParticipantResponse[] | BackendEnvelope<EventParticipantResponse[]>>(
      "/api/v1/users/me/event-participations",
    );
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    return [];
  },

  isDuplicateRegistrationError: (error: unknown) =>
    error instanceof ApiError && error.status === 409,
};
