import { api, ApiError, request } from "@/lib/api/apiClient";

export type EventParticipantStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED";

export const EVENT_PARTICIPANT_STATUSES: EventParticipantStatus[] = [
  "PENDING",
  "ACTIVE",
  "REJECTED",
];

export interface EventParticipantResponse {
  id?: string;
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
  participantStatus?: EventParticipantStatus;
  appliedAt?: string;
  registeredAt?: string;
  approvedAt?: string;
  approvedBy?: string | { fullName?: string; email?: string };
  approvedByName?: string;
  rejectedReason?: string;
  currentStatus?: EventParticipantStatus;
  user?: {
    userId?: string;
    fullName?: string;
    email?: string;
    fptStudentCode?: string;
    externalStudentCode?: string;
    universityName?: string;
  };
  event?: {
    eventId?: string;
    eventName?: string;
  };
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

function normalizeParticipant(participant: EventParticipantResponse): EventParticipantResponse {
  const approvedBy = typeof participant.approvedBy === "object"
    ? participant.approvedBy as { fullName?: string; email?: string }
    : undefined;

  const rawStatus = participant.participantStatus ?? participant.status ?? participant.currentStatus ?? "PENDING";
  const status = normalizeParticipantStatus(rawStatus);

  return {
    ...participant,
    participantId: String(participant.participantId ?? participant.eventParticipantId ?? ""),
    eventParticipantId: participant.eventParticipantId ?? participant.participantId,
    userId: String(participant.userId ?? participant.user?.userId ?? ""),
    fullName: participant.fullName ?? participant.user?.fullName ?? "",
    email: participant.email ?? participant.user?.email ?? "",
    fptStudentCode: participant.fptStudentCode ?? participant.user?.fptStudentCode,
    externalStudentCode: participant.externalStudentCode ?? participant.user?.externalStudentCode,
    universityName: participant.universityName ?? participant.user?.universityName,
    eventId: String(participant.eventId ?? participant.event?.eventId ?? ""),
    eventName: participant.eventName ?? participant.event?.eventName ?? "",
    status,
    participantStatus: status,
    currentStatus: status,
    registeredAt: participant.registeredAt ?? participant.appliedAt,
    approvedBy: typeof participant.approvedBy === "string" ? participant.approvedBy : undefined,
    approvedByName: participant.approvedByName ?? approvedBy?.fullName ?? approvedBy?.email,
  };
}

function normalizeParticipantStatus(status: unknown): EventParticipantStatus {
  const value = String(status ?? "").trim().replace(/[-\s]+/g, "_").toUpperCase();
  if (value === "PENDING_APPROVAL") return "PENDING";
  if (value === "ACTIVE" || value === "REJECTED" || value === "PENDING") return value;
  return "PENDING";
}

function normalizeParticipants(participants: EventParticipantResponse[]) {
  return participants.map(normalizeParticipant);
}

function paramsFromQuery(query: EventParticipantsQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      if (key === "sortBy" || key === "sortDirection") return;
      params.set(key, String(value));
    }
  });
  if (query.sortBy) {
    params.set("sort", `${query.sortBy},${query.sortDirection ?? "desc"}`);
  }
  return params.toString();
}

function unwrapPage(response: EventParticipantResponse[] | BackendEnvelope<EventParticipantsPage | EventParticipantResponse[]>): EventParticipantsPage {
  if (Array.isArray(response)) {
    const content = normalizeParticipants(response);
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
      size: content.length,
    };
  }

  const data = response.data;
  if (Array.isArray(data)) {
    const content = normalizeParticipants(data);
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
      size: content.length,
    };
  }

  if (data && !Array.isArray(data) && Array.isArray(data.content)) {
    const content = normalizeParticipants(data.content);
    return {
      content,
      totalElements: data.totalElements ?? content.length,
      totalPages: data.totalPages ?? 1,
      number: data.number ?? 0,
      size: data.size ?? content.length,
    };
  }

  if (Array.isArray(response.content)) {
    const content = normalizeParticipants(response.content);
    return {
      content,
      totalElements: response.totalElements ?? content.length,
      totalPages: response.totalPages ?? 1,
      number: response.number ?? response.page ?? 0,
      size: response.size ?? content.length,
    };
  }

  throw new Error(response.message ?? "Unexpected event participants response from server.");
}

function normalizeSingle(response: EventParticipantResponse | BackendEnvelope<EventParticipantResponse>) {
  const participant = "data" in response && response.data && !Array.isArray(response.data)
    ? response.data
    : response as EventParticipantResponse;

  return normalizeParticipant(participant);
}

export const eventParticipantService = {
  getOrganizerParticipants: async (query: EventParticipantsQuery) => {
    const qs = paramsFromQuery(query);
    return unwrapPage(await api.get<EventParticipantResponse[] | BackendEnvelope<EventParticipantsPage | EventParticipantResponse[]>>(
      `/api/v1/organizer/event-participants${qs ? `?${qs}` : ""}`,
    ));
  },

  updateStatus: async (participantId: string, status: EventParticipantStatus, rejectedReason?: string) =>
    normalizeSingle(await api.patch<EventParticipantResponse | BackendEnvelope<EventParticipantResponse>>(`/api/v1/organizer/event-participants/${participantId}/status`, {
      status,
      rejectedReason: rejectedReason?.trim() || undefined,
    })),

  bulkUpdateStatus: (participantIds: string[], status: EventParticipantStatus, rejectedReason?: string) =>
    api.patch<void>("/api/v1/organizer/event-participants/status", {
      participantIds,
      status,
      rejectedReason: rejectedReason?.trim() || undefined,
    }),

  registerForEvent: async (eventId: string) =>
    normalizeSingle(await request<EventParticipantResponse | BackendEnvelope<EventParticipantResponse>>(
      `/api/v1/events/${eventId}/participants/register`,
      { method: "POST" },
    )),

  register: async (eventId: string) =>
    eventParticipantService.registerForEvent(eventId),

  getMyParticipation: async (eventId: string) => {
    try {
      return normalizeSingle(await api.get<EventParticipantResponse | BackendEnvelope<EventParticipantResponse>>(
        `/api/v1/events/${eventId}/participants/me`,
      ));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  getMyParticipations: async () => {
    const response = await api.get<EventParticipantResponse[] | BackendEnvelope<EventParticipantResponse[] | EventParticipantsPage>>(
      "/api/v1/users/me/event-participations",
    );
    if (Array.isArray(response)) return normalizeParticipants(response);
    if (Array.isArray(response.data)) return normalizeParticipants(response.data);
    if (response.data && !Array.isArray(response.data) && Array.isArray(response.data.content)) {
      return normalizeParticipants(response.data.content);
    }
    if (Array.isArray(response.content)) return normalizeParticipants(response.content);
    return [];
  },

  isDuplicateRegistrationError: (error: unknown) =>
    error instanceof ApiError
    && error.status === 409,
};
